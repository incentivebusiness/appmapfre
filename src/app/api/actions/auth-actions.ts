// import { PrismaClient } from "@prisma/client/extension";
// import * as bcrypt from 'bcrypt';
// import { redirect } from "next/navigation";

// const prisma = new PrismaClient();

// async function createAccount(formData: FormData) {
//     'use server'
//     const name = formData.get('name') as string;
//     const email = formData.get('email') as string;
//     const password = formData.get('password') as string;
//     //const confirmPassword = formData.get('confirmPassword')

//     const hashPassword = await bcrypt.hash(password, 10);

//     await prisma.user.create({
//         data: {
//             name,
//             email,
//             passwordHash: hashPassword
//         }
//     });

//     redirect('/login');
// }

// const AuthActions = {
//     createAccount
// };

// export default AuthActions;