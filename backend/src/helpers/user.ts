import * as randomstring from 'randomstring';
import * as bcrypt from 'bcrypt';
import SendMail from './SendMail';
import db from '../db/models';

export default {

    /**
     * @return encrypted version of plaintext
     */
    async encrypt(plaintext: string) {
        return (await bcrypt.hash(plaintext, 10)).replace(/^\$2a/, '$2y');
    },

    /**
     * Compares plaintext and encrypted
     *
     * @param - to check
     * @param encrypted - from database
     *
     */
    async compareEncrypted(plaintext: string, encrypted: string) {
        return await bcrypt.compare(plaintext, encrypted.replace(/^\$2y/, '$2a'))
    },

    /**
     * @param length - of plaintext code
     *
     * @return { plaintext, encrypted }
     */
    async generateAuthCode(length: number = 6) {

        const plaintext = randomstring.generate(length);

        return {
            encrypted: this.encrypt(plaintext),
            plaintext
        };
    },

    sendTwoFactorCode(userInfo: {email: string, profileLink: string, id: string}) {

        const authCode = this.generateAuthCode();

        db.models.users.update(
            {
                auth: authCode,
                auth_time: new Date()
            },
            {
                where: {
                    id: userInfo.id
                }
            });

        SendMail.emailAuth(userInfo.email.substr(1), userInfo.profileLink.substr(1), authCode);
    }
}