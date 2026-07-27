import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { CreateBackupDto } from './dto/create-backup.dto';
import { SupabaseStorageService } from '../common/storage/supabase-storage.service';

const execAsync = promisify(exec);

export interface BackupInfo {
    filename: string;
    size: number;
    createdAt: string;
    path: string;
}

@Injectable()
export class BackupService {
    private readonly backupDir: string;
    private readonly dbHost: string;
    private readonly dbPort: number;
    private readonly dbName: string;
    private readonly dbUser: string;
    private readonly dbPassword: string;
    private readonly pgDumpPath: string;
    private readonly psqlPath: string;
    private readonly bucketName = 'backups';

    constructor(
        private readonly supabaseStorageService: SupabaseStorageService,
    ) {
        const isWindows = process.platform === 'win32';

        // Default backup directory - production ready path
        const defaultBackupDir = isWindows
            ? 'C:\\ProgramData\\JHASMANY\\Backups'
            : '/tmp/backups';
        this.backupDir = process.env.BACKUP_DIR || defaultBackupDir;

        // Database configuration - try to parse DATABASE_URL if provided
        const dbUrl = process.env.DATABASE_URL;
        let host = process.env.DB_HOST || 'localhost';
        let port = parseInt(process.env.DB_PORT || '5433', 10);
        let name = process.env.DB_DATABASE || 'indent_clinic';
        let user = process.env.DB_USERNAME || 'postgres';
        let password = process.env.DB_PASSWORD || 'postgrespg';

        if (dbUrl) {
            try {
                // Remove potential extra spaces
                const cleanDbUrl = dbUrl.trim();
                const parsedUrl = new URL(cleanDbUrl);
                host = parsedUrl.hostname;
                port = parseInt(parsedUrl.port, 10) || 5432;
                user = parsedUrl.username;
                password = parsedUrl.password ? decodeURIComponent(parsedUrl.password) : password;
                name = parsedUrl.pathname.startsWith('/') ? parsedUrl.pathname.slice(1) : parsedUrl.pathname;

                // Handle query parameters in name if any
                if (name.includes('?')) {
                    name = name.split('?')[0];
                }
            } catch (e) {
                console.error('Error parsing DATABASE_URL in BackupService:', e);
            }
        }

        this.dbHost = host;
        this.dbPort = port;
        this.dbName = name;
        this.dbUser = user;
        this.dbPassword = password;

        // PostgreSQL binary paths
        const defaultPgPath = isWindows ? 'C:\\Program Files\\PostgreSQL\\14\\bin' : '';
        const pgBinPath = process.env.PG_BIN_PATH || defaultPgPath;

        this.pgDumpPath = process.env.PG_DUMP_PATH || (isWindows ? path.join(pgBinPath, 'pg_dump.exe') : 'pg_dump');
        this.psqlPath = process.env.PSQL_PATH || (isWindows ? path.join(pgBinPath, 'psql.exe') : 'psql');

        // Ensure backup directory exists
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }

        // Log paths for debugging
        console.log(`System Platform: ${process.platform}`);
        console.log('PostgreSQL paths configured:');
        console.log('  pg_dump:', this.pgDumpPath);
        console.log('  psql:', this.psqlPath);
        console.log('  Backup directory:', this.backupDir);
    }

    async createBackup(createBackupDto?: CreateBackupDto): Promise<BackupInfo> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `jhasmany_backup_${timestamp}.sql`;
        const targetDir = createBackupDto?.customPath || this.backupDir;
        const backupPath = path.join(targetDir, filename);

        // Ensure target directory exists
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        try {
            // Check if pg_dump exists (only if absolute path is provided)
            if (path.isAbsolute(this.pgDumpPath) && !fs.existsSync(this.pgDumpPath)) {
                throw new Error(`pg_dump not found at: ${this.pgDumpPath}. Please install PostgreSQL or set PG_DUMP_PATH environment variable.`);
            }

            // Set PGPASSWORD environment variable for authentication
            const env = { ...process.env, PGPASSWORD: this.dbPassword };

            // Execute pg_dump command with full path
            const command = `"${this.pgDumpPath}" -h ${this.dbHost} -p ${this.dbPort} -U ${this.dbUser} -d ${this.dbName} -F p -f "${backupPath}"`;

            console.log('Executing backup command...');
            await execAsync(command, { env });

            // Get file stats
            const stats = fs.statSync(backupPath);

            // Upload backup to Supabase Storage if customPath is not specified
            if (!createBackupDto?.customPath) {
                try {
                    const fileBuffer = fs.readFileSync(backupPath);
                    await this.supabaseStorageService.uploadFile(
                        this.bucketName,
                        filename,
                        fileBuffer,
                        'application/x-sql',
                    );
                    console.log(`Backup ${filename} uploaded successfully to Supabase Storage.`);
                } catch (cloudErr) {
                    console.error('Warning: Failed to upload backup to Supabase Storage:', cloudErr);
                }
            }

            return {
                filename,
                size: stats.size,
                createdAt: stats.birthtime.toISOString(),
                path: backupPath,
            };
        } catch (error) {
            console.error('Error creating backup:', error);
            throw new InternalServerErrorException(`Failed to create backup: ${error.message}`);
        }
    }

    async listBackups(): Promise<BackupInfo[]> {
        try {
            const backupsMap = new Map<string, BackupInfo>();

            // 1. Read local backups
            if (fs.existsSync(this.backupDir)) {
                const files = fs.readdirSync(this.backupDir);
                for (const file of files) {
                    if (file.endsWith('.sql')) {
                        const filePath = path.join(this.backupDir, file);
                        const stats = fs.statSync(filePath);

                        backupsMap.set(file, {
                            filename: file,
                            size: stats.size,
                            createdAt: stats.birthtime.toISOString(),
                            path: filePath,
                        });
                    }
                }
            }

            // 2. Fetch remote backups from Supabase Storage
            try {
                const remoteFiles = await this.supabaseStorageService.listFilesInBucket(this.bucketName);
                for (const remote of remoteFiles) {
                    if (remote.name.endsWith('.sql') && !backupsMap.has(remote.name)) {
                        backupsMap.set(remote.name, {
                            filename: remote.name,
                            size: remote.size,
                            createdAt: remote.createdAt,
                            path: path.join(this.backupDir, remote.name),
                        });
                    }
                }
            } catch (cloudErr) {
                console.error('Warning: Failed to list remote backups from Supabase Storage:', cloudErr);
            }

            const backups = Array.from(backupsMap.values());

            // Sort by creation date, newest first
            return backups.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        } catch (error) {
            console.error('Error listing backups:', error);
            throw new InternalServerErrorException('Failed to list backups');
        }
    }

    async getBackupInfo(filename: string): Promise<BackupInfo> {
        const filePath = path.join(this.backupDir, filename);

        // If file doesn't exist locally, try downloading from Supabase Storage
        if (!fs.existsSync(filePath)) {
            try {
                const buffer = await this.supabaseStorageService.downloadFileFromBucket(this.bucketName, filename);
                if (buffer) {
                    if (!fs.existsSync(this.backupDir)) {
                        fs.mkdirSync(this.backupDir, { recursive: true });
                    }
                    fs.writeFileSync(filePath, buffer);
                    console.log(`Downloaded ${filename} from Supabase Storage to local directory.`);
                }
            } catch (cloudErr) {
                console.error(`Failed to download ${filename} from Supabase Storage:`, cloudErr);
            }
        }

        if (!fs.existsSync(filePath)) {
            throw new NotFoundException(`Backup file ${filename} not found`);
        }

        const stats = fs.statSync(filePath);

        return {
            filename,
            size: stats.size,
            createdAt: stats.birthtime.toISOString(),
            path: filePath,
        };
    }

    async restoreBackup(filename: string): Promise<{ message: string }> {
        // Ensures backup file is available locally (downloads from Supabase Storage if missing)
        const backupInfo = await this.getBackupInfo(filename);
        const filePath = backupInfo.path;

        try {
            // Check if psql exists (only if absolute path is provided)
            if (path.isAbsolute(this.psqlPath) && !fs.existsSync(this.psqlPath)) {
                throw new Error(`psql not found at: ${this.psqlPath}. Please install PostgreSQL or set PSQL_PATH environment variable.`);
            }

            // Set PGPASSWORD environment variable for authentication
            const env = { ...process.env, PGPASSWORD: this.dbPassword };

            // First, terminate all connections to the database
            const terminateCommand = `"${this.psqlPath}" -h ${this.dbHost} -p ${this.dbPort} -U ${this.dbUser} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${this.dbName}' AND pid <> pg_backend_pid();"`;

            try {
                await execAsync(terminateCommand, { env });
            } catch (error) {
                // Ignore errors from terminating connections
                console.log('Note: Some connections may not have been terminated');
            }

            // Drop and recreate database
            const dropCommand = `"${this.psqlPath}" -h ${this.dbHost} -p ${this.dbPort} -U ${this.dbUser} -d postgres -c "DROP DATABASE IF EXISTS ${this.dbName};"`;
            await execAsync(dropCommand, { env });

            const createCommand = `"${this.psqlPath}" -h ${this.dbHost} -p ${this.dbPort} -U ${this.dbUser} -d postgres -c "CREATE DATABASE ${this.dbName};"`;
            await execAsync(createCommand, { env });

            // Restore from backup
            const restoreCommand = `"${this.psqlPath}" -h ${this.dbHost} -p ${this.dbPort} -U ${this.dbUser} -d ${this.dbName} -f "${filePath}"`;
            await execAsync(restoreCommand, { env });

            return { message: `Database restored successfully from ${filename}` };
        } catch (error) {
            console.error('Error restoring backup:', error);
            throw new InternalServerErrorException(`Failed to restore backup: ${error.message}`);
        }
    }

    async deleteBackup(filename: string): Promise<{ message: string }> {
        const filePath = path.join(this.backupDir, filename);

        let deletedAny = false;

        // 1. Delete local file if exists
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                deletedAny = true;
            } catch (err) {
                console.error(`Error unlinking local backup file ${filename}:`, err);
            }
        }

        // 2. Delete remote file from Supabase Storage
        try {
            await this.supabaseStorageService.deleteFileFromBucket(this.bucketName, filename);
            deletedAny = true;
        } catch (cloudErr) {
            console.error(`Error deleting backup ${filename} from Supabase Storage:`, cloudErr);
        }

        if (!deletedAny) {
            throw new NotFoundException(`Backup file ${filename} not found`);
        }

        return { message: `Backup ${filename} deleted successfully` };
    }
}

