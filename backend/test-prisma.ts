import prisma from './src/utils/prisma'; prisma.purchaseOrder.findMany({ orderBy: { createdAt: 'desc' } }).then(console.log).catch(console.error);
