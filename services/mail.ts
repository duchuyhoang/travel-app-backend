import transporter from "@common/mailer";
import { Transporter } from "nodemailer";
// export default transporter;

interface BaseSendMailSettings {
  from: string;
  to: Array<string>;
  subject: string;
}

interface HTMLMailPayload extends BaseSendMailSettings {
  html: string;
}
interface TextMailPayload extends BaseSendMailSettings {
  text: string;
}

class MailService {
  private transporter: Transporter;
  constructor() {
    this.transporter = transporter;
  }
  async sendHTMLMail(payload: HTMLMailPayload) {
    this.transporter.sendMail({ ...payload, to: payload.to.join(", ") });
  }
  async sendTextMail(payload: TextMailPayload) {
    this.transporter.sendMail({ ...payload, to: payload.to.join(", ") });
  }
}

export default MailService;
