import { PAYMENT_EVENT_TYPES } from "./constants";
import {
  AccountTransaction,
  Bill,
  Customer,
  Investment,
  PixKey,
} from "./models";
import { Context } from "./context";
import * as GqlOperations from "./utils/graphql-operations";

export class Account {
  private _accountId: string = "";
  private _customerId: string = "";

  public constructor(private _context: Context) {}

  public me(): Promise<Customer> {
    return this._context.http
      .request("get", "customer")
      .then((data) => data.customer);
  }

  private async ready(): Promise<void> {
    if (!this._accountId || !this._customerId) {
      const { data } = await this._context.http.graphql(
        GqlOperations.QUERY_ACCOUNT_ID
      );
      this._accountId = data?.viewer?.savingsAccount?.id;
      this._customerId = data?.viewer?.id;
    }
  }

  public async getId(): Promise<string> {
    await this.ready();
    return this._accountId;
  }

  public async getCustomerId(): Promise<string> {
    await this.ready();
    return this._customerId;
  }

  public async getPixKeys(): Promise<PixKey[]> {
    const { data } = await this._context.http.graphql(
      GqlOperations.QUERY_GET_PIX_KEYS
    );
    return data?.viewer?.savingsAccount?.dict?.keys;
  }

  public async getBills(options: {
    getFutureBillsDetails?: boolean;
    billsAfterDueDate?: Date;
  }): Promise<Bill[]> {
    options = { getFutureBillsDetails: false, ...options };

    const data = await this._context.http.request("get", "bills_summary");

    const futureBillsUrl = data._links?.future?.href;
    let bills = data.bills;

    if (options.getFutureBillsDetails && futureBillsUrl) {
      const dataFuture = await this._context.http.request(
        "get",
        futureBillsUrl
      );
      const closedAndOpenedBills = data.bills.filter(
        (bill: Bill) => bill.state !== "future"
      );
      bills = dataFuture.bills.concat(closedAndOpenedBills);
    }

    if (options.billsAfterDueDate) {
      bills = bills.filter(
        (bill: Bill) =>
          this.parseDate(bill.summary.due_date) >=
          (options.billsAfterDueDate as Date)
      );
    }

    return await Promise.all(
      bills.map((bill: Bill) => this.getBillDetails(bill))
    );
  }

  public async getBalance(): Promise<number> {
    const { data } = await this._context.http.graphql(
      GqlOperations.QUERY_ACCOUNT_BALANCE
    );
    return data.viewer?.savingsAccount?.currentSavingsBalance?.netAmount;
  }

  public async getFeed(): Promise<AccountTransaction[]> {
    const { data } = await this._context.http.graphql(
      GqlOperations.QUERY_ACCOUNT_FEED
    );
    return data?.viewer?.savingsAccount?.feed;
  }

  public async getFeedPaginated(): Promise<AccountTransaction[]> {
    const { data } = await this._context.http.graphql(
      GqlOperations.QUERY_ACCOUNT_FEED_PAGINATED,
      {}
    );
    return data;
  }
  
  public getTransactions(): Promise<AccountTransaction[]> {
    return this.getFeed().then((feed) =>
      feed.filter((statement) =>
        PAYMENT_EVENT_TYPES.includes(statement.__typename)
      )
    );
  }

  public async getInvestments(): Promise<Investment[]> {
    const { data } = await this._context.http.graphql(
      GqlOperations.QUERY_ACCOUNT_INVESTMENTS
    );
    return data?.viewer?.savingsAccount?.redeemableDeposits;
  }

  private async getBillDetails(bill: Bill): Promise<Bill> {
    const url: string = bill?._links?.self?.href ?? "";
    if (!url) {
      return bill;
    }
    const response: any = await this._context.http.request("get", url);
    return response.bill;
  }

  public async getPixDetail(
    txId: any
  ): Promise<any> {
    const getPixInfo = {
      type: "TRANSFER_IN",
      id: txId
    };
    const { data: get_pix_info } = await this._context.http.graphql(
      GqlOperations.MUTATION_GET_PIX_TXID,
      getPixInfo 
    );
    const data = get_pix_info?.viewer?.savingsAccount?.getGenericReceiptScreen?.screenPieces;
    if(!data) return null;
    const { footerTitle } = data.find((i:any) => i.__typename === "ReceiptFooterPiece");
    
    const titleToFind = "ID da transação:"
    const endToEndId = footerTitle.toString().substring(footerTitle.toString().indexOf(titleToFind) + titleToFind.length - 1).replace(":", "").trim();
    
    const { tableItems } = data.find((i:any) => i.__typename === "ReceiptTablePiece" && !i.tableHeader);
    const valorLabel = tableItems.find((i: any)=>i.label==='Valor');
    const typeLabel = tableItems.find((i: any)=>i.label==='Tipo de transferência');
    const amount = parseFloat(valorLabel.value.replace(/R\$/gi, "").replace(/\./gi,"").trim().replace(",", "."));
    
    const { tableItems: tableItemsOrigem } = data.find((i:any) => i.__typename === "ReceiptTablePiece" && i?.tableHeader?.title === "Origem");
    const { tableItems: tableItemsDestino } = data.find((i:any) => i.__typename === "ReceiptTablePiece" && i?.tableHeader?.title === "Destino");
    const tableItemsGeneral = data.find((i:any) => i.__typename === "ReceiptTablePiece" && i?.tableHeader?.title === "Dados gerais do pagamento")?.tableItems;

    return {
      endToEndId,
      amount,
      type: typeLabel.value,
      identificador: tableItemsGeneral?.find((i: any)=>i.label==='Identificador')?.value,
      origem: {
        nome: tableItemsOrigem?.find((i: any)=>i.label==='Nome')?.value,
        doc: tableItemsOrigem?.find((i: any)=>i.label==='CPF')?.value || tableItemsOrigem?.find((i: any)=>i.label==='CNPJ')?.value,
        instituicao: tableItemsOrigem?.find((i: any)=>i.label==='Instituição')?.value,
        agencia: tableItemsOrigem?.find((i: any)=>i.label==='Agência')?.value,
        conta: tableItemsOrigem?.find((i: any)=>i.label==='Conta')?.value,
        tipoConta: tableItemsOrigem?.find((i: any)=>i.label==='Tipo de conta')?.value,
        chavePix: tableItemsOrigem?.find((i: any)=>i.label==='Chave Pix')?.value,
      },
      destino: {
        nome: tableItemsDestino?.find((i: any)=>i.label==='Nome')?.value,
        doc: tableItemsDestino?.find((i: any)=>i.label==='CPF')?.value || tableItemsDestino?.find((i: any)=>i.label==='CNPJ')?.value,
        instituicao: tableItemsDestino?.find((i: any)=>i.label==='Instituição')?.value,
        agencia: tableItemsDestino?.find((i: any)=>i.label==='Agência')?.value,
        conta: tableItemsDestino?.find((i: any)=>i.label==='Conta')?.value,
        tipoConta: tableItemsDestino?.find((i: any)=>i.label==='Tipo de conta')?.value,
        chavePix: tableItemsDestino?.find((i: any)=>i.label==='Chave Pix')?.value,
      }
    }
  }

  private parseDate(dateStr: string): Date {
    const dateParts = dateStr.split("-");
    return new Date(
      parseInt(dateParts[0], 10),
      parseInt(dateParts[1], 10),
      parseInt(dateParts[2], 10)
    );
  }
}
