import { Boleto, MoneyRequest, PixKey, PixPaymentRequest } from "./models";
import { Context } from "./context";
export declare class Payment {
    private _context;
    constructor(_context: Context);
    createBoleto(amount: number): Promise<Boleto>;
    createMoneyRequest(amount: number): Promise<MoneyRequest>;
    createPixPaymentRequest(pixKey: PixKey, amount: number): Promise<PixPaymentRequest>;
    createPixPaymentRequestWithTX(pixKey: PixKey, amount: number, uid: string, message?: string): Promise<PixPaymentRequest>;
}
