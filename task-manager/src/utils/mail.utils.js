import Mailgen from "mailgen";
import nodemailer from "nodemailer";


const sendMail = async(options) => {
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "Task Manager",
            link: "https://mailgen.js/"
        }
    });

    const emailText = mailGenerator.generatePlaintext(options.mailGenContent);
    const emailHtml = mailGenerator.generate(options.mailGenContent);

    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST,
        port: process.env.MAILTRAP_PORT,
        secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
        auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS,
        },
    });

    const mail = {
        from: "mail.taskmanager@example.com",
        to: options.email,
        subject: options.subject,
        text: emailText,
        html: emailHtml
    };

    try {
        await transporter.sendMail(mail);
    } catch (error) {
        console.error("email failed: ", error);
    }
};

const emailVerificationMailGenContent = (username, verificaltionUrl) => {
    return{
        name: username,
        intro: "welcome to taskmanager! we're excited to have you onboard",
        action: {
            instructions: "to get started with taskmanager, please click here:",
            button: {
                color: "#22BC66",
                text: "verify your email",
                link: verificaltionUrl
            }
        },
        outro: "need help, or have questions? just reply to this email, we'd love to help"
    }
};

const forgotPasswordMailGenContent = (username, passwordResetUrl) => {
    return{
        name: username,
        intro: "we got a request to reset your password",
        action: {
            instructions: "to change your password click the button:",
            button: {
                color: "#55FB11",
                text: "reset password",
                link: passwordResetUrl
            }
        },
        outro: "need help, or have questions? just reply to this email, we'd love to help"
    }
};

// sendMail({
//     email: user.email,
//     subject: "something",
//     mailGenContent: emailVerificationMailGenContent(
//         username,
//         ``
//     )
// });

