import base64, json, urllib.request, datetime

EMAIL='dualwarez@gmail.com'
TOKEN='ATATT3xFfGF0nQkMUT5hEASzuF4h1q1RuwpZFgy8mr9gUP6OEJG4IWGiTGcP5wZUFZxHa5j5HZ96UeXe1QXtRedsWOvRoQ83XSV6OdP7PvtJRIIDdFa_Ozth5Wi0c5hqnj8a7xBNKn_G26iXCEUUwJIqytEbMSgyW7PH5hxZyO1X4UO9WxckIDE=C875C3D5'
AUTH='Basic '+base64.b64encode(f'{EMAIL}:{TOKEN}'.encode()).decode()
BASE='https://dualwarez.atlassian.net'

def call(method, path, body=None):
    req=urllib.request.Request(BASE+path, method=method, headers={'Authorization':AUTH,'Content-Type':'application/json'},
        data=json.dumps(body).encode() if body is not None else None)
    try:
        raw=urllib.request.urlopen(req).read()
        return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        print(method, path, 'ERR', e.code, e.read()[:300]); return {}

me=call('GET','/rest/api/3/myself')['accountId']
board=call('GET','/rest/agile/1.0/board?projectKeyOrId=SPD&boardType=scrum')['values'][0]['id']
print('board', board)

# story points field: check createmeta for SPD issue
meta=call('GET','/rest/api/3/issue/createmeta?projectKeys=SPD&issuetypeNames=Story&expand=projects.issuetypes.fields')
fields=meta['projects'][0]['issuetypes'][0]['fields']
sp=[k for k,v in fields.items() if 'story point' in v.get('name','').lower() or 'storypoint' in k.lower()]
sprint_f=[k for k,v in fields.items() if v.get('name','').lower()=='sprint']
print('SP field:', sp, 'sprint field:', sprint_f)
SP=sp[0] if sp else None
SPRINT_F=sprint_f[0] if sprint_f else 'customfield_10020'
# probe SP via issue create meta on Story type fallback names
if not SP:
    for cand in ['customfield_10016','customfield_10026','customfield_10031','customfield_10034']:
        meta2=call('GET',f'/rest/api/3/field/{cand}')
        if meta2.get('name','').lower().startswith('story point'):
            SP=cand; print('SP found:', SP, meta2['name']); break

def mkdate(days_ago):
    d=datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(days=days_ago)
    return d.strftime('%Y-%m-%dT%H:%M:%S.000Z')

# create 3 sprints: S1 done (21-14), S2 done (14-7), S3 active (7-0)
sprints=[]
specs=[('Sprint 1',21,14,True),('Sprint 2',14,7,True),('Sprint 3',7,0,False)]
if True:
    # reuse created sprints 2,3,4
    sprints=[(2,True),(3,True),(4,False)]
    print('using sprints', sprints)
# first sprint complete
sid1=call('GET',f'/rest/agile/1.0/board/{board}/sprint?state=future,active,closed')
for s in sid1['values']:
    print('listed sprint:', s['id'], s['name'], s['state'])

# issue plan: (summary, type, points, sprintIdx, status)
plan=[]
data=[
 ('User login page','Story',5,0),('User login API','Story',3,0),('Signup validation bug','Bug',2,0),
 ('Dashboard skeleton','Story',8,0),('Design tokens setup','Story',2,0),
 ('Search bar UI','Story',5,1),('Search API','Story',5,1),('Pagination bug','Bug',3,1),
 ('Profile page','Story',3,1),('Session timeout bug','Bug',1,1),('Notifications API','Story',8,1),
 ('Email templates','Task',2,1),('Filter logic bug','Bug',5,1),
 ('Checkout flow','Story',13,2),('Payment integration','Story',8,2),('Cart API','Story',5,2),
 ('Rate limiting bug','Bug',3,2),('Analytics events','Task',3,2),('Mobile responsive fixes','Story',5,2),
]
statuses=[('done','Done'),('done','Done'),('done','Done'),('done','Done'),('done','Done'),
 ('done','Done'),('done','Done'),('done','Done'),('done','Done'),('done','Done'),('done','Done'),('done','Done'),
 ('done','Done'),('done','Done'),('done','Done'),
 ('indeterminate','In Progress'),('indeterminate','In Progress'),('to do','To Do'),('to do','To Do')]
# S0: all done except one done-2pts ghost (created never worked)
for i,(summary,typ,pts,si) in enumerate(data):
    st=statuses[i][1]
    if i==4 and si==0: st='To Do'  # ghost ticket in S1
    body={'fields':{'project':{'key':'SPD'},'summary':summary,'issuetype':{'name':typ},'description':{'type':'doc','version':1,'content':[{'type':'paragraph','content':[{'type':'text','text':'Seeded demo issue for Sprint Autopsy'}]}]}}}
    if SP: body['fields'][SP]=pts
    r=call('POST','/rest/api/3/issue',body)
    key=r.get('key')
    if key and SPRINT_F:
        call('PUT',f'/rest/api/3/issue/{key}',{'fields':{SPRINT_F:sprints[si][0]}})
    # transition status
    if key:
        trans=call('GET',f'/rest/api/3/issue/{key}/transitions')
        want=statuses[i][0]
        for t in trans.get('transitions',[]):
            if t['to']['statusCategory']['key']==want:
                call('POST',f'/rest/api/3/issue/{key}/transitions',{'transition':{'id':t['id']}})
                break
    print('issue', key, summary, '->', st)
# close sprints 1,2
for sid,closed in sprints[:2]:
    if closed:
        call('PUT',f'/rest/agile/1.0/sprint/{sid}',{'state':'closed','completeDate':mkdate(14) if sid==sprints[0][0] else mkdate(7)})
        print('closed sprint', sid)
print('SEED DONE')
