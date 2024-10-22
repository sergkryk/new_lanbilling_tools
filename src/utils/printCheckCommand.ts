import { PrintCheckCommand } from "../types/types";

export const printCheckCommand = function (sum: number, isCashless = false ): PrintCheckCommand {
  return {
        goods: [{
            name: "Услуги связи",
            price: sum,
            count: 1,
            sum,
            nds_not_apply: true,
            item_type: 4,
            payment_mode: 4,
        }],
        author: "Крюков Сергей Николаевич",
        tag1055: "2",
        smsEmail54FZ: "sgkryk@gmail.com",
        payed_cash: !isCashless ? sum : 0,
        payed_cashless: isCashless ? sum : 0,
        payed_credit: 0,
        payed_prepay: 0,
        payed_consideration: 0,
      };
}