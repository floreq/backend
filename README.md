# Backend
Uruchomienie serwera:
```
npm install (pierwsze uruchomienie)
node server.js
```

## Struktura tabeli w bazie
1. Tasks

| id  | action_date | created_at | deleted_at | task | comment | expense | quantity | metal_type | origin_id |
| --- | ----------- | ---------- | ---------- | ---- | ------- | ------- | -------- | ---------- | --------- |
| integer | text | text | text | text | text | integer | integer | text | integer |

## Możliwe zapytania do bazy

Żądania są odbierane w **formacie obiektu JavaScript** tylko adresów z [Whitelisty](https://github.com/floreq/backend/blob/b32749f18db4208f49e90a45377dd7d3ec826763/server.js#L12).

Odpowiedzi są wysyłane w **formacie pliku JSON**.

### Zapytania GET
`"/tasks"`

1. Zapytanie zwraca **wszystkie rekordy** z bazy.

>Przykładowa odpowiedź
```json
[{"id": 1, "actionDate": "01.01.1000", "createdAt": "[data dodana przez zapytanie POST]", "deletedAt": "[data dodana przez zaptanie DELETE]", "task": "zakup", "comment": "","expense": 0,"quantity": 0,"metalType": "stalowy", "originId": 1},
{"id": 2, "actionDate": "01.01.1000", "createdAt": "[data dodana przez zapytanie POST]", "deletedAt": "", "task": "zakup", "comment": "","expense": 0,"quantity": 0,"metalType": "stalowy", "originId": 1}]
```
---

`"/workplaces/:id"`

1. Zapytanie zwraca **wybrane dane** z bazy:
   - stan kasy (cashStatus),
   - stan kasy zgrupowany dniami (sumCashStatusGroupByDay),
   - sume wydatków przez siedem ostatnich dni (sumExpenseLast7Days),
   - sume wydatków zgrupowanych dniami (expensesGroupByDay),
   - stan metali (metalInStock),
   - stan metali zgrupowanych dniami (metalInStockGroupByDay),
   - sume zaliczek zgrupowane dniami (sumAdvancePaymentGroupByDay),
   - sume wpływów zgrupowane dniami (sumIncomeGroupByDay)
   - sume odebranych metali (Collection).
   
>Przykładowa odpowiedź
```json
{"cashStatus": -1, "originId": 1, "sumExpenseLast7Days": 1, "metalInStock": [{"metalTypeName": "kolorowy", "sumMetalIncome": 0}, {"metalTypeName": "stalowy", "sumMetalIncome": 1}], "expensesGroupByDay": [{"correctDateFormat": "2019-08-04", "actionDate": "04.08.2019", "sumExpenses": 1}], "sumAdvancePaymentGroupByDay":[], "metalInStockGroupByDay":[{"correctDateFormat":"2019-08-04", "actionDate": "04.08.2019", "metalTypeName": "stalowy", "sumMetalInStock": 1}], "sumIncomeGroupByDay":[],"sumCashStatusGroupByDay":[{"correctDateFormat": "2019-08-04", "actionDate": "04.08.2019", "cashStatus": -1}], "sumAverageGroupByDay":[{"correctDateFormat": "2019-08","actionDate":"08.2019", "metalTypeName": "stalowy", "average": 1}]}
```
---

`"/workplaces/"`

1. Zapytanie zwraca wszystkie możliwe **workplaces**

>Przykładowa odpowiedź
```json
[{"cashStatus": -1, "originId": 1, "sumExpenseLast7Days": 1, "metalInStock": [{"metalTypeName": "kolorowy", "sumMetalIncome": 0}, {"metalTypeName": "stalowy", "sumMetalIncome": 1}], "expensesGroupByDay": [{"correctDateFormat": "2019-08-04", "actionDate": "04.08.2019", "sumExpenses": 1}], "sumAdvancePaymentGroupByDay":[], "metalInStockGroupByDay":[{"correctDateFormat":"2019-08-04", "actionDate": "04.08.2019", "metalTypeName": "stalowy", "sumMetalInStock": 1}], "sumIncomeGroupByDay":[],"sumCashStatusGroupByDay":[{"correctDateFormat": "2019-08-04", "actionDate": "04.08.2019", "cashStatus": -1}], "sumAverageGroupByDay":[{"correctDateFormat": "2019-08","actionDate":"08.2019", "metalTypeName": "stalowy", "average": 1}]}, 
{"cashStatus": -2, "originId": 2, "sumExpenseLast7Days": 2 ,"metalInStock": [{"metalTypeName":"kolorowy","sumMetalIncome":3}, {"metalTypeName": "stalowy", "sumMetalIncome": 0}], "expensesGroupByDay": [{"correctDateFormat": "2019-08-03", "actionDate": "03.08.2019", "sumExpenses": 2}], "sumAdvancePaymentGroupByDay": [], "metalInStockGroupByDay": [{"correctDateFormat": "2019-08-03", "actionDate": "03.08.2019", "metalTypeName": "kolorowy", "sumMetalInStock": 3}],"sumIncomeGroupByDay": [],"sumCashStatusGroupByDay":[{"correctDateFormat": "2019-08-03", "actionDate": "03.08.2019", "cashStatus": -2}],"sumAverageGroupByDay":[{"correctDateFormat": "2019-08", "actionDate": "08.2019", "metalTypeName": "kolorowy", "average": 0.7}]}, 
{"cashStatus": 0, "originId": 3 ,"sumExpenseLast7Days": 0 ,"metalInStock": [{"metalTypeName": "kolorowy", "sumMetalIncome": 0}, {"metalTypeName": "stalowy", "sumMetalIncome": 0}], "expensesGroupByDay": [], "sumAdvancePaymentGroupByDay": [], "metalInStockGroupByDay": [], "sumIncomeGroupByDay": [], "sumCashStatusGroupByDay": [], "sumAverageGroupByDay": []}]
```
### Zapytanie POST
`"/tasks"`

1. Zapytanie **dodaje rekord** z otrzymanymi danymi od frontendu do bazy.
2. Zwraca w odpowiedź dodany rekord zgodny z jego parametrem id.

>Przykładowa odpowiedź
```json
{"cashStatus": 0, "originId": 1, "sumExpenseLast7Days": 0, "metalInStock": [{"metalTypeName": "kolorowy", "sumMetalIncome": 0}, {"metalTypeName": "stalowy", "sumMetalIncome": 0}], "expensesGroupByDay": [],"sumAdvancePaymentGroupByDay": [], "metalInStockGroupByDay": [], "sumIncomeGroupByDay": [], "sumCashStatusGroupByDay": []}
```
### Zapytanie DELETE
`"/tasks/:id"`

1. Zapytanie **dodaj do pola deletedAt** wartość z funkcji new Date().
2. Zwraca w odpowiedź zaktualizowany rekord zgodny z jego parametrem id.

>Przykładowa odpowiedź
```json
{"id": 1, "actionDate": "01.01.1000", "createdAt": "[data dodana przez zapytanie POST]", "deletedAt": "[data dodana przez zaptanie DELETE]", "task": "zakup", "comment": "", "expense": 0, "quantity": 0, "metalType": "stalowy", "originId": 1}
```

