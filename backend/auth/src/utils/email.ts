import { exec } from 'child_process';

export const sendMail = async ({ to, subject, text }: { to: string; subject: string; text: string }) => {
  const command = `echo "Subject: ${subject}\n\n${text}" | sendmail ${to}`;
  exec(command, (error, stdout, stderr) => {
    if (error) console.error(`Error sending email: ${stderr}`);
  });
};

