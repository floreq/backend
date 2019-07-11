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

2. Origin

| id  | name | 
| --- | -----| 
| integer | text |

## Możliwe zapytania do bazy

Żądania są odbierane w **formacie obiektu JavaScript**

Odpowiedzi są wysyłane w **formacie pliku JSON**

### Zapytania GET
`"/tasks"`

1. Zapytanie zwraca **wszystkie rekordy** z bazy.

>Przykładowe żadanie
```javascript
{actionDate: "07.07.2019", task: "zakup", comment: "Test", expense: "1", quantity: "1", task: "zakup"}
```

>Przykładowa odpowiedź
```json
[{"id": 1, "actionDate": "01.01.1000", "createdAt": "[data dodana przez zapytanie POST]", "deletedAt": "[data dodana przez zaptanie DELETE]", "task": "zakup", "comment": "","expense": 0,"quantity": 0,"metalType": "stalowy"},
{"id": 2, "actionDate": "01.01.1000", "createdAt": "[data dodana przez zapytanie POST]", "deletedAt": "", "task": "zakup", "comment": "","expense": 0,"quantity": 0,"metalType": "stalowy"}]
```
---

`"/workplaces/:id"`

1. Zapytanie zwraca **wybrane dane** z bazy:
   - sume wydatków,
   - sume przychodów,
   - sume zakupionych metali (Income),
   - sume odebranych metali (Collection).
   
>Przykładowa odpowiedź
```json
{"sumExpense":1,"originId":1,"sumIncome":1,"metalIncome":[{"metalTypeName":"kolorowy","sumMetalIncome":1},{"metalTypeName":"stalowy","sumMetalIncome":4}],"metalCollection":[{"metalTypeName":"stalowy","sumMetalIncome":1}]}
```

### Zapytanie POST
`"/tasks"`

1. Zapytanie **dodaje rekord** z otrzymanymi danymi od frontendu do bazy.
2. Zwraca w odpowiedź dodany rekord zgodny z jego parametrem id.

>Przykładowa odpowiedź
```json
{"id": 1, "actionDate": "01.01.1000", "createdAt": "[data dodana przez zapytanie POST]", "deletedAt": "", "task": "zakup", "comment": "","expense": 0,"quantity": 0,"metalType": "stalowy"}
```
### Zapytanie DELETE
`"/tasks/:id"`

1. Zapytanie **dodaj do pola deletedAt** wartość z funkcji new Date().
2. Zwraca w odpowiedź zaktualizowany rekord zgodny z jego parametrem id.

>Przykładowa odpowiedź
```json
{"id": 1, "actionDate": "01.01.1000", "createdAt": "[data dodana przez zapytanie POST]", "deletedAt": "[data dodana przez zaptanie DELETE]", "task": "zakup", "comment": "","expense": 0,"quantity": 0,"metalType": "stalowy"}
```

