import { app, HttpRequest, InvocationContext } from '@azure/functions';
import Handlebars from 'handlebars';
import { EmailClient } from '@azure/communication-email';
import fs from 'fs';
import path from 'path';

// Conexión a Azure Communication Service
const connectionString = "endpoint=https://emails-206.unitedstates.communication.azure.com/;accesskey=2vE48eAPWnDqWvftPHneWNdH0VdMnDu4R9YX4ZXCuQyNMXfhjLHIJQQJ99AKACULyCps5mg0AAAAAZCSkm8p";
const client = new EmailClient(connectionString);

// Definir la interfaz para los datos esperados en la solicitud
interface EmailRequestData {
    subject: string;
    templateName: string;
    dataTemplate: {
        name: string;
    };
    to: string;
}

// Definir el endpoint HTTP
app.http('httpTrigger1', {
    methods: ['POST'],
    handler: async (request: HttpRequest, context: InvocationContext) => {
        try {
            // Leer y tipar los datos del cuerpo de la solicitud
            const requestData = await request.json() as EmailRequestData;

            // Extraer los datos del cuerpo
            const { subject, templateName, dataTemplate, to } = requestData;

            // Leer y compilar la plantilla de Handlebars
            const templatePath = path.join(__dirname, templateName);
            const source = fs.readFileSync(templatePath, 'utf-8');
            const template = Handlebars.compile(source);
            const html = template({ name: dataTemplate.name });

            // Configurar el mensaje de correo electrónico
            const emailMessage = {
                senderAddress: "DoNotReply@ff70fa3c-7b9f-47b4-9204-7b5ce8cb669c.azurecomm.net",
                content: {
                    subject: subject,
                    html: html,
                },
                recipients: {
                    to: [{ address: to }],
                },
            };

            // Enviar el correo electrónico
            const poller = await client.beginSend(emailMessage);
            const result = await poller.pollUntilDone();

            // Registrar el resultado y devolver respuesta
            context.log("Email sent successfully:", result);
            return { body: "Email sent successfully" };

        } catch (error) {
            // Manejo de errores
            context.log("Error sending email:", error);
            return { status: 500, body: "Error sending email" };
        }
    }
});
