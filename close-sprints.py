import base64, json, urllib.request, datetime
EMAIL='dualwarez@gmail.com'
TOKEN='ATATT3xFfGF0nQkMUT5hEASzuF4h1q1RuwpZFgy8mr9gUP6OEJG4IWGiTGcP5wZUFZxHa5j5HZ96UeXe1QXtRedsWOvRoQ83XSV6OdP7PvtJRIIDdFa_Ozth5Wi0c5hqnj8a7xBNKn_G26iXCEUUwJIqytEbMSgyW7PH5hxZyO1X4UO9WxckIDE=C875C3D5'
AUTH='Basic '+base64.b64encode(f'{EMAIL}:{TOKEN}'.encode()).decode()
BASE='https://dualwarez.atlassian.net'
def call(method, path, body=None):
    req=urllib.request.Request(BASE+path, method=method, headers={'Authorization':AUTH,'Content-Type':'application/json'},
        data=json.dumps(body).encode() if body is not None else None)
    raw=urllib.request.urlopen(req).read()
    return json.loads(raw) if raw else {}
def iso(days_ago):
    return (datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(days=days_ago)).strftime('%Y-%m-%dT%H:%M:%S.000Z')
call('PUT','/rest/agile/1.0/sprint/2',{'name':'Sprint 1','state':'closed','completeDate':iso(14)})
call('PUT','/rest/agile/1.0/sprint/3',{'name':'Sprint 2','state':'closed','completeDate':iso(7)})
call('PUT','/rest/agile/1.0/sprint/4',{'name':'Sprint 3','state':'active'})
for s in call('GET','/rest/agile/1.0/board/3/sprint')['values']:
    print(s['id'], s['name'], s['state'])
