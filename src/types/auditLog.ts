export interface AuditLog {
  logId: number;
  userId: number;
  action: string;
  tableName: string;
  recordId: number;
  oldValues: string;    // JSON string from .NET
  newValues: string;    // JSON string from .NET
  timestamp: string;    // ISO 8601
}
