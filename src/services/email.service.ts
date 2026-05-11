type EmailPayload = {
  to: string;
  subject: string;
  text: string;
};

async function sendEmail({ to, subject, text }: EmailPayload) {
  // Keeps the integration point in place without hard-coding a provider.
  console.log(`[email] to=${to} subject=${subject} text=${text}`);
}

export async function sendRegistrationEmail(userEmail: string, name: string) {
  await sendEmail({
    to: userEmail,
    subject: "Welcome to Transition Backend",
    text: `Hello ${name}, thank you for registering.`,
  });
}

export async function sendTransactionEmail(
  userEmail: string,
  name: string,
  amount: number,
  toAccountId: number,
) {
  await sendEmail({
    to: userEmail,
    subject: "Transaction Successful",
    text: `Hello ${name}, your transaction of ${amount} to account ${toAccountId} was successful.`,
  });
}
