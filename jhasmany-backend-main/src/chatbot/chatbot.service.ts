import { Injectable, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import makeWASocket, {
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    getAggregateVotesInPollMessage,
} from '@whiskeysockets/baileys';
import * as QRCode from 'qrcode';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PacientesService } from '../pacientes/pacientes.service';
import { AgendaService } from '../agenda/agenda.service';
import { WhatsappSession } from './entities/whatsapp-session.entity';
import pino from 'pino';
import * as fs from 'fs';
import * as path from 'path';

// @ts-ignore
import { decryptPollVote } from '@whiskeysockets/baileys/lib/Utils/process-message.js';
// @ts-ignore
import { getKeyAuthor } from '@whiskeysockets/baileys/lib/Utils/generics.js';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

interface SessionState {
    sock: any;
    qrCode: string | null;
    status: 'disconnected' | 'connecting' | 'connected' | 'qr';
    intentionalDisconnect: boolean;
    initializationStartTime: number | null;
    initializationTimeout: NodeJS.Timeout | null;
    userSessions: Map<string, { type: 'new' | 'registered' | 'waiting_cancellation_reason' | 'waiting_agenda_response', timestamp: number, citaId?: number }>;
    pollStore: Map<string, { message: any, citaId: number }>;
}

@Injectable()
export class ChatbotService implements OnModuleInit, OnModuleDestroy {
    private sessions = new Map<number, SessionState>();

    constructor(
        @Inject(forwardRef(() => PacientesService))
        private readonly pacientesService: PacientesService,
        private readonly agendaService: AgendaService,
        @InjectRepository(WhatsappSession)
        private readonly whatsappSessionRepository: Repository<WhatsappSession>,
    ) { }

    private getSession(): SessionState {
        if (!this.sessions.has(1)) {
            this.sessions.set(1, {
                sock: null,
                qrCode: null,
                status: 'disconnected',
                intentionalDisconnect: false,
                initializationStartTime: null,
                initializationTimeout: null,
                userSessions: new Map(),
                pollStore: new Map(),
            });
        }
        return this.sessions.get(1)!;
    }

    async onModuleInit() {
        console.log('[Chatbot] Starting initialization...');
        this.initialize().catch(err => {
            console.error(`[Chatbot] Failed to initialize session:`, err);
        });
    }

    async onModuleDestroy() {
        for (const [clinicId, session] of this.sessions.entries()) {
            if (session.sock) {
                try {
                    session.sock.end(undefined);
                } catch (e) { }
            }
        }
    }

    async initialize() {
        const session = this.getSession();
        if (session.status === 'connected' || session.status === 'connecting') {
            console.log(`[Chatbot] [JHASMANY] Already connected or connecting. Skipping initialization.`);
            return;
        }

        session.intentionalDisconnect = false; // Reset flag
        session.status = 'connecting';
        session.initializationStartTime = Date.now();

        // Clear any existing timeout
        if (session.initializationTimeout) {
            clearTimeout(session.initializationTimeout);
        }

        // Set timeout to reset status if initialization takes too long
        session.initializationTimeout = setTimeout(() => {
            if (session.status === 'connecting') {
                console.log(`[Chatbot] [JHASMANY] Initialization timeout - resetting to disconnected`);
                session.status = 'disconnected';
                session.qrCode = null;
                session.initializationStartTime = null;
                if (session.sock) {
                    try {
                        session.sock.end(undefined);
                    } catch (error) {
                        console.error(`[Chatbot] [JHASMANY] Error ending socket on timeout:`, error);
                    }
                }
            }
        }, 60000); // Increased timeout to 60s for loading buffers

        try {
            const { state, saveCreds } = await this.useDatabaseAuthState(1);

            const { version, isLatest } = await fetchLatestBaileysVersion();
            console.log(`[Chatbot] [JHASMANY] Initializing (WA version: ${version.join('.')}, isLatest: ${isLatest})...`);

            session.sock = makeWASocket({
                version,
                logger: pino({ level: 'error' }) as any,
                auth: {
                    creds: state.creds,
                    keys: state.keys,
                },
                generateHighQualityLinkPreview: true,
                browser: ['JHASMANY Chatbot', 'Chrome', '1.0.0'],
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 60000,
                keepAliveIntervalMs: 10000,
                emitOwnEvents: true,
                retryRequestDelayMs: 250,
                getMessage: async (key) => {
                    if (key.id && session.pollStore.has(key.id)) {
                        return session.pollStore.get(key.id)!.message;
                    }
                    return undefined;
                }
            });

            console.log(`[Chatbot] [JHASMANY] Socket created. Setting up event listeners...`);

            session.sock.ev.on('connection.update', async (update: any) => {
                const { connection, lastDisconnect, qr } = update;
                const elapsed = session.initializationStartTime ? Date.now() - session.initializationStartTime : 0;
                console.log(`[Chatbot] [JHASMANY] Connection Update:`, { connection, qr: qr ? 'QR RECEIVED' : 'NO QR', elapsed: `${elapsed}ms` });

                if (qr) {
                    session.status = 'qr';
                    session.qrCode = await QRCode.toDataURL(qr);
                    console.log(`[Chatbot] [JHASMANY] QR Code generated`);

                    if (session.initializationTimeout) {
                        clearTimeout(session.initializationTimeout);
                        session.initializationTimeout = null;
                    }
                }

                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
                    const errorMsg = lastDisconnect?.error?.message || 'Unknown error';
                    console.log(`[Chatbot] [JHASMANY] Connection closed. Reconnecting:`, shouldReconnect, 'Error:', errorMsg);
                    session.status = 'disconnected';
                    session.qrCode = null;
                    session.initializationStartTime = null;

                    if (session.initializationTimeout) {
                        clearTimeout(session.initializationTimeout);
                        session.initializationTimeout = null;
                    }

                    if (shouldReconnect && !session.intentionalDisconnect) {
                        this.initialize();
                    } else {
                        console.log(`[Chatbot] [JHASMANY] Logged out or Intentional Disconnect.`);
                    }
                } else if (connection === 'open') {
                    console.log(`[Chatbot] [JHASMANY] Connection opened successfully`);
                    session.status = 'connected';
                    session.qrCode = null;
                    session.initializationStartTime = null;

                    if (session.initializationTimeout) {
                        clearTimeout(session.initializationTimeout);
                        session.initializationTimeout = null;
                    }
                }
            });

            session.sock.ev.on('creds.update', saveCreds);

            session.sock.ev.on('messages.upsert', async (m: any) => {
                try {
                    fs.appendFileSync(`chatbot-poll-upsert-jhasmany.log`, `\n[${new Date().toISOString()}] messages.upsert: ${JSON.stringify(m)}\n`);
                } catch (e) { }

                for (const msg of m.messages) {
                    const pollUpdateMessage = msg.message?.pollUpdateMessage || msg.message?.messageContextInfo?.message?.pollUpdateMessage;
                    if (pollUpdateMessage) {
                        try {
                            const creationMsgKey = pollUpdateMessage.pollCreationMessageKey;
                            if (session.pollStore.has(creationMsgKey.id)) {
                                const { message: pollMsg, citaId } = session.pollStore.get(creationMsgKey.id)!;

                                const meIdNormalised = jidNormalizedUser(session.sock?.user?.id || '');
                                const pollCreatorJid = getKeyAuthor(creationMsgKey, meIdNormalised);
                                const voterJid = getKeyAuthor(msg.key, meIdNormalised);
                                const pollEncKey = pollMsg.messageContextInfo?.messageSecret!;

                                const voteMsg = decryptPollVote(
                                    pollUpdateMessage.vote!,
                                    {
                                        pollEncKey,
                                        pollCreatorJid,
                                        pollMsgId: creationMsgKey.id!,
                                        voterJid,
                                    }
                                );

                                const pollUpdates = [
                                    {
                                        pollUpdateMessageKey: msg.key,
                                        vote: voteMsg,
                                        senderTimestampMs: pollUpdateMessage.senderTimestampMs
                                    }
                                ];

                                const aggregation = getAggregateVotesInPollMessage({
                                    message: pollMsg,
                                    pollUpdates: pollUpdates as any
                                }, meIdNormalised);

                                fs.appendFileSync(`chatbot-poll-jhasmany.log`, `\n[${new Date().toISOString()}] Manual Poll aggregation: ${JSON.stringify(aggregation)}\n`);
                                console.log(`[Chatbot] [JHASMANY] Manual Poll aggregation:`, aggregation);
                                for (const agg of aggregation) {
                                    if (agg.voters.length > 0) {
                                        const isLid = msg.key.remoteJid?.endsWith('@lid');
                                        const normalizedMsgJid = isLid ? (msg.key.remoteJidAlt || msg.key.remoteJid) : msg.key.remoteJid;
                                        await this.handleAgendaPollResponse(agg.name, citaId, normalizedMsgJid!);
                                        break;
                                    }
                                }
                            }
                        } catch (err: any) {
                            fs.appendFileSync(`chatbot-poll-jhasmany.log`, `\n[${new Date().toISOString()}] Decrypt Error: ${err.message}\n`);
                        }
                        continue;
                    }

                    if (!msg.key.fromMe) {
                        console.log(`[Chatbot] [JHASMANY] New message received:`, JSON.stringify(msg, null, 2));
                        await this.handleMessage(msg);
                    }
                }
            });

            session.sock.ev.on('messages.update', async (event: any) => {
                for (const { key, update } of event) {
                    if (update.pollUpdates && session.pollStore.has(key.id)) {
                        const { message, citaId } = session.pollStore.get(key.id)!;
                        const aggregation = getAggregateVotesInPollMessage({
                            message: message,
                            pollUpdates: update.pollUpdates,
                        });

                        for (const agg of aggregation) {
                            if (agg.voters.length > 0) {
                                const selectedOption = agg.name;
                                let resolvedJid = key.remoteJid!;
                                if (resolvedJid?.endsWith('@lid')) {
                                    const storedJid = message?.key?.remoteJid;
                                    if (storedJid && !storedJid.endsWith('@lid')) {
                                        resolvedJid = storedJid;
                                    }
                                }
                                await this.handleAgendaPollResponse(selectedOption, citaId, resolvedJid);
                                break;
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error(`[Chatbot] [JHASMANY] Error during initialization:`, error);
            session.status = 'disconnected';
            session.qrCode = null;
            session.initializationStartTime = null;
            if (session.initializationTimeout) {
                clearTimeout(session.initializationTimeout);
                session.initializationTimeout = null;
            }
            throw error;
        }
    }

    private async useDatabaseAuthState(clinicId: number = 1) {
        const { BufferJSON, initAuthCreds } = await import('@whiskeysockets/baileys');
        let creds: any;

        const sessionCreds = await this.whatsappSessionRepository.findOne({
            where: { type: 'creds' }
        });

        if (sessionCreds) {
            creds = JSON.parse(JSON.stringify(sessionCreds.data), BufferJSON.reviver);
        } else {
            creds = initAuthCreds();
        }

        const saveCreds = async () => {
            const existing = await this.whatsappSessionRepository.findOne({
                where: { type: 'creds' }
            });
            const serializedCreds = JSON.parse(JSON.stringify(creds, BufferJSON.replacer));
            if (existing) {
                existing.data = serializedCreds;
                await this.whatsappSessionRepository.save(existing);
            } else {
                const newSession = this.whatsappSessionRepository.create({
                    type: 'creds',
                    data: serializedCreds
                });
                await this.whatsappSessionRepository.save(newSession);
            }
        };

        return {
            state: {
                creds,
                keys: {
                    get: async (type: string, ids: string[]) => {
                        const data: { [id: string]: any } = {};
                        await Promise.all(
                            ids.map(async (id) => {
                                const typeKey = `key-${type}`;
                                const key = await this.whatsappSessionRepository.findOne({
                                    where: { type: typeKey, keyId: id }
                                });
                                if (key) {
                                    let value = JSON.parse(JSON.stringify(key.data), BufferJSON.reviver);
                                    data[id] = value;
                                }
                            })
                        );
                        return data;
                    },
                    set: async (data: any) => {
                        for (const type in data) {
                            for (const id in data[type]) {
                                const value = data[type][id];
                                const typeKey = `key-${type}`;
                                const existing = await this.whatsappSessionRepository.findOne({
                                    where: { type: typeKey, keyId: id }
                                });

                                if (value) {
                                    const serialized = JSON.parse(JSON.stringify(value, BufferJSON.replacer));
                                    if (existing) {
                                        existing.data = serialized;
                                        await this.whatsappSessionRepository.save(existing);
                                    } else {
                                        const newKey = this.whatsappSessionRepository.create({
                                            type: typeKey,
                                            keyId: id,
                                            data: serialized
                                        });
                                        await this.whatsappSessionRepository.save(newKey);
                                    }
                                } else {
                                    if (existing) {
                                        await this.whatsappSessionRepository.remove(existing);
                                    }
                                }
                            }
                        }
                    }
                }
            },
            saveCreds
        };
    }

    async handleMessage(msg: any) {
        const session = this.getSession();
        let remoteJid = msg.key?.remoteJid;

        // NEW: Normalize JID if the message comes from a Linked Device (@lid)
        if (remoteJid?.endsWith('@lid') && msg.key.remoteJidAlt && msg.key.remoteJidAlt.endsWith('@s.whatsapp.net')) {
            console.log(`[Chatbot] [JHASMANY] Normalized @lid incoming message to: ${msg.key.remoteJidAlt}`);
            remoteJid = msg.key.remoteJidAlt;
        }

        if (!remoteJid) {
            console.log(`[Chatbot] [JHASMANY] No remoteJid found, skipping.`);
            return;
        }

        let senderJid = msg.key.participant || remoteJid;

        if (senderJid.endsWith('@lid') && msg.key.remoteJidAlt && msg.key.remoteJidAlt.endsWith('@s.whatsapp.net')) {
            console.log(`[Chatbot] [JHASMANY] Detected @lid JID (${senderJid}), falling back to remoteJidAlt: ${msg.key.remoteJidAlt}`);
            senderJid = msg.key.remoteJidAlt;
        }

        const phonePart = senderJid.split('@')[0];
        const phone = phonePart.split(':')[0];
        const isGroup = remoteJid.endsWith('@g.us');

        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        const normalizedText = text.toLowerCase();

        console.log(`[Chatbot] [JHASMANY] New message from ${senderJid} in ${remoteJid}: "${text}"`);

        // ─── PRIORIDAD 1: Sesiones de espera activas ─────
        const currentSession = session.userSessions.get(remoteJid);

        if (currentSession && currentSession.type === 'waiting_agenda_response' && currentSession.citaId) {
            const respuesta = normalizedText.trim();
            if (respuesta === 'a') {
                try {
                    await this.agendaService.update(currentSession.citaId, { estado: 'confirmado' } as any);
                    await this.sendMessage(remoteJid, '¡Gracias! Tu cita ha sido confirmada satisfactoriamente. ✅');
                } catch (err) {
                    await this.sendMessage(remoteJid, 'Ocurrió un error al confirmar tu cita. Por favor, contáctanos directamente.');
                }
                session.userSessions.delete(remoteJid);
                return;
            } else if (respuesta === 'b') {
                try {
                    await this.agendaService.update(currentSession.citaId, { estado: 'cancelado' } as any);
                    await this.sendMessage(remoteJid, 'Por favor, comuníquese con el Dr. para agendar su cita en otra fecha y horario, gracias');
                } catch (err) {}
                session.userSessions.delete(remoteJid);
                return;
            } else {
                await this.sendMessage(remoteJid, 'Por favor responde *A* para confirmar o *B* para cancelar tu cita.');
                return;
            }
        }



        // ─── PRIORIDAD 2: Detener si es un grupo ──────────────────────────────────
        if (isGroup) return;


    }




    async sendBirthdayGreeting(pacienteId: number) {
        const paciente = await this.pacientesService.findOne(pacienteId);
        if (!paciente) {
            throw new Error('Paciente no encontrado');
        }

        // const currentYear = new Date().getFullYear();
        // if (paciente.ultimo_cumpleanos_felicitado === currentYear) {
        //     throw new Error('Ya se envió una felicitación a este paciente este año');
        // }

        let celular = paciente.telefono_celular?.replace(/\D/g, '');
        if (!celular) {
            throw new Error('El paciente no tiene número de celular registrado');
        }

        if (!celular.startsWith('51') && celular.length === 9) {
            celular = `51${celular}`;
        }
        const jid = `${celular}@s.whatsapp.net`;
        
        const maternoText = paciente.materno ? ` ${paciente.materno}` : '';
        const text = `¡Hola ${paciente.nombre} ${paciente.paterno}${maternoText}! 🎉 En nombre de tu Dr. Jhasmany Ojeda Cardona, te deseo un muy feliz cumpleaños. ¡Que tengas un excelente día! 🎂🎈\n\n📌 Hola, por favor guarda mi número para recibir tus felicitaciones y recordatorios.`;

        await this.sendMessage(jid, text);

        // await this.pacientesService.update(pacienteId, { ultimo_cumpleanos_felicitado: currentYear } as any);
        return { success: true };
    }

    async sendMessage(jid: string, content: string | any) {

        const session = this.getSession();
        if (session.status !== 'connected' || !session.sock) {
            console.warn(`[Chatbot] [JHASMANY] Cannot send message to ${jid}: Not connected (status: ${session.status})`);
            throw new Error('El chatbot no está conectado a WhatsApp');
        }

        try {
            await session.sock.sendPresenceUpdate('composing', jid);
            // Increased delay to 3-8 seconds for better anti-ban protection
            const delayMs = Math.floor(Math.random() * 5000) + 3000;
            await new Promise(resolve => setTimeout(resolve, delayMs));
            await session.sock.sendPresenceUpdate('paused', jid);

            if (typeof content === 'string') {
                await session.sock.sendMessage(jid, { text: content });
            } else {
                await session.sock.sendMessage(jid, content);
            }
        } catch (error) {
            console.error(`[Chatbot] [JHASMANY] Error sending message:`, error);
            throw error;
        }
    }

    async sendPdf(jid: string, base64: string, fileName: string, caption?: string) {
        const buffer = Buffer.from(base64, 'base64');
        await this.sendMessage(jid, {
            document: buffer,
            mimetype: 'application/pdf',
            fileName: fileName,
            caption: caption || ''
        });
    }

    async sendAgendaPoll(jid: string, pollName: string, options: string[], citaId: number) {
        const session = this.getSession();
        if (session.status !== 'connected' || !session.sock) {
            console.warn(`[Chatbot] [JHASMANY] Cannot send poll to ${jid}: Not connected`);
            throw new Error('El chatbot no está conectado a WhatsApp');
        }

        try {
            await session.sock.sendPresenceUpdate('composing', jid);
            // Increased delay to 3-8 seconds
            const delayMs = Math.floor(Math.random() * 5000) + 3000;
            await new Promise(resolve => setTimeout(resolve, delayMs));
            await session.sock.sendPresenceUpdate('paused', jid);

            const msg = await session.sock.sendMessage(jid, {
                poll: {
                    name: pollName,
                    values: options,
                    selectableCount: 1
                }
            });
            session.pollStore.set(msg?.key?.id, { message: msg.message, citaId });
            try {
                fs.appendFileSync(`chatbot-poll-jhasmany.log`, `\n[${new Date().toISOString()}] Sent Poll for Cita ${citaId}. msg.key.id: ${msg?.key?.id}\n`);
            } catch (e) { }
            return msg;
        } catch (error) {
            console.error(`[Chatbot] [JHASMANY] Error sending poll:`, error);
            throw error;
        }
    }

    /**
     * Envía un menú de texto A/B al paciente y registra sesión waiting_agenda_response.
     */
    async sendAgendaMenu(jid: string, mensajeIntro: string, citaId: number): Promise<void> {
        const session = this.getSession();
        const menuTexto = `${mensajeIntro}\n\nPor favor responde con una Letra:\nA ✅ Confirmar Cita \nB ❌ Cancelar Cita\n\n📌 Por favor guarda mi número para recibir tus felicitaciones y recordatorios.`;
        await this.sendMessage(jid, menuTexto);
        session.userSessions.set(jid, {
            type: 'waiting_agenda_response' as any,
            timestamp: Date.now(),
            citaId,
        });
    }

    async handleAgendaPollResponse(selectedOption: string, citaId: number, remoteJid: string) {
        const session = this.getSession();
        if (selectedOption.includes('Confirmar')) {
            await this.agendaService.update(citaId, { estado: 'confirmado' } as any);
            await this.sendMessage(remoteJid, "¡Gracias! Tu cita ha sido confirmada satisfactoriamente.");
        } else if (selectedOption.includes('Cancelar')) {
            try {
                await this.agendaService.update(citaId, { estado: 'cancelado' } as any);
                await this.sendMessage(remoteJid, 'Por favor, comuníquese con el Dr. para agendar su cita en otra fecha y horario, gracias');
            } catch (err) {}
        }
    }

    getStatus() {
        const session = this.getSession();
        return {
            status: session.status,
            qr: session.qrCode
        };
    }

    async disconnect() {
        const session = this.getSession();
        if (session.sock) {
            session.intentionalDisconnect = true;
            session.sock.end(undefined);
            session.status = 'disconnected';
            session.qrCode = null;
            session.initializationStartTime = null;

            if (session.initializationTimeout) {
                clearTimeout(session.initializationTimeout);
                session.initializationTimeout = null;
            }
        }
    }

    async resetSession() {
        await this.disconnect();
        await new Promise(resolve => setTimeout(resolve, 1000));

        const session = this.getSession();
        session.status = 'disconnected';
        session.qrCode = null;

        // Clear database sessions for this clinic
        await this.whatsappSessionRepository.clear();
        console.log(`[Chatbot] Deleted database sessions for JHASMANY`);
    }


}
