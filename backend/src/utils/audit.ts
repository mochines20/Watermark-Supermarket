type AuditAction = 'CREATE' | 'UPDATE' | 'APPROVE' | 'REJECT' | 'DELETE' | 'VIEW';

interface AuditInput {
  userId?: string;
  userName?: string;
  action: AuditAction;
  module: string;
  referenceId: string;
  referenceNo?: string;
  details: string;
  previousData?: unknown;
  newData?: unknown;
}

export const logAudit = async (prisma: any, input: AuditInput) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId || 'SYSTEM',
        userName: input.userName || input.userId || 'SYSTEM',
        action: input.action,
        module: input.module,
        recordId: input.referenceId,
        recordNo: input.referenceNo,
        description: input.details,
        previousData: input.previousData as any,
        newData: input.newData as any
      }
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
};

export const auditUser = (req: any) => ({
  userId: req.user?.id || req.__auditContext?.userId || 'SYSTEM',
  userName: req.user?.name || req.user?.email || req.__auditContext?.userName || 'SYSTEM'
});
