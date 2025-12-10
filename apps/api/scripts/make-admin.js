const { PrismaClient } = require('@prisma/client');

async function makeAdmin() {
  const prisma = new PrismaClient();
  
  try {
    // 全ユーザー取得
    const users = await prisma.user.findMany({
      select: { id: true, email: true, isAdmin: true }
    });
    
    console.log('=== 現在のユーザー一覧 ===');
    users.forEach(u => {
      console.log(`${u.email} - Admin: ${u.isAdmin}`);
    });
    
    if (users.length === 0) {
      console.log('ユーザーがいません');
      return;
    }
    
    // 最初のユーザーを管理者に
    const firstUser = users[0];
    if (!firstUser.isAdmin) {
      await prisma.user.update({
        where: { id: firstUser.id },
        data: { isAdmin: true }
      });
      console.log(`\n✅ ${firstUser.email} を管理者に昇格しました！`);
    } else {
      console.log(`\n${firstUser.email} は既に管理者です`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();




