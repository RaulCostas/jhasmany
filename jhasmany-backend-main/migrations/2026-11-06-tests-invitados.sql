-- Migración para soportar Tests y Dinámicas para Pacientes No Registrados (Invitados)
ALTER TABLE paciente_tests ALTER COLUMN paciente_id DROP NOT NULL;
ALTER TABLE paciente_tests ADD COLUMN IF NOT EXISTS es_invitado boolean DEFAULT false;
ALTER TABLE paciente_tests ADD COLUMN IF NOT EXISTS invitado_nombre text;
ALTER TABLE paciente_tests ADD COLUMN IF NOT EXISTS invitado_paterno text;
ALTER TABLE paciente_tests ADD COLUMN IF NOT EXISTS invitado_materno text;
ALTER TABLE paciente_tests ADD COLUMN IF NOT EXISTS invitado_celular text;
