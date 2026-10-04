"""离线重算教学例子；只用 Python 标准库，不调用或测量 LLM。"""
from pathlib import Path
from decimal import Decimal as D
from collections import Counter
from statistics import median
import csv,json
ROOT=Path(__file__).resolve().parent
def read(name):return json.loads((ROOT/name).read_text())
def rag():
    data=read('rag-fixture.json'); assert data['synthetic']
    current={}
    for row in data['notes']:
        key=row['entity_id']
        if key not in current or row['revision']>current[key]['revision']:current[key]=row
    counts=dict(Counter(row['topic'] for row in current.values()))
    assert len(data['notes'])==8 and len(current)==7
    assert counts=={'RAG':2,'Memory':3,'Cost':2}
    assert current['rag-01']['id']=='N2'
    return {'raw_records':8,'unique_notes':7,'topic_counts':counts,'excluded_old_revision':['N1']}
def memory():
    data=read('memory-events.json'); assert data['synthetic']
    state={'blog':None,'demo':None}; revisions={'blog':0,'demo':0}; results=[]
    for event in data['events']:
        scope=event['scope'];op=event['op'];write='applied'
        if op in ('set','exception'):
            state[scope]=event['value'];revisions[scope]+=1
        elif op in ('end','revoke'):
            state[scope]=None;revisions[scope]+=1
        elif op=='derived_write':
            if event['base_revision']!=revisions[scope]:write='rejected'
            else:state[scope]=event['value'];revisions[scope]+=1
        else:raise ValueError(op)
        assert state==event['expected'],event['id']
        if 'expected_write' in event:assert write==event['expected_write']
        results.append({'event':event['id'],'state':state.copy(),'write':write})
    return results
def cost():
    rows=list(csv.DictReader((ROOT/'cost-ledger.csv').open()))
    ledger={}
    for config in ('A','B'):
        batch=[x for x in rows if x['configuration']==config]
        assert all(x['synthetic']=='true' for x in batch)
        assert len({x['task_id'] for x in batch})==100
        cost=sum((D(x['total_automatic_cost_yuan']) for x in batch),D(0))
        accepted=sum(x['accepted_without_rewrite']=='true' for x in batch)
        ledger[config]={'cost':str(cost),'accepted':accepted,'cost_per_accepted':str(cost/accepted),'completion_cost_assuming_rescue':str(cost+D(100-accepted)*D('.20'))}
    assert D(ledger['A']['cost'])==18 and ledger['A']['accepted']==50
    assert D(ledger['B']['cost'])==25 and ledger['B']['accepted']==95
    data=read('cost-scenarios.json');assert data['synthetic'];s=data['routing']
    n=D(s['tasks']);good=n*D(s['cheap_accuracy']);bad=n-good
    caught=bad*D(s['error_detection']);missed=bad-caught;false_reject=good*D(s['false_rejection'])
    fallback=caught+false_reject
    assert D(s['fallback_accuracy'])==1 and D(s['direct_accuracy'])==1
    total=n*(D(s['cheap_cost'])+D(s['verification_cost']))+fallback*D(s['fallback_cost'])
    threshold=(n*D(s['direct_cost'])-total)/missed
    assert (fallback,missed,total,threshold)==(220,20,164,D('1.8'))
    tail=list(map(D,data['tail_costs']));curve=data['budget_curve']
    marginal=[]
    for previous,current in zip(curve,curve[1:]):
        gain=current['accepted']-previous['accepted']
        marginal.append({'to':current['config'],'extra_successes':gain,'cost_per_extra_success':str(D(current['cost']-previous['cost'])/gain) if gain else None})
    return {'ledger':ledger,'routing':{'fallbacks':int(fallback),'undetected_errors':int(missed),'actual_correct':int(n-missed),'cost_yuan':str(total),'error_loss_break_even_yuan':str(threshold)},'tail':{'mean':str(sum(tail)/len(tail)),'median':str(median(tail)),'largest_share':str(max(tail)/sum(tail))},'marginal':marginal}
if __name__=='__main__':
    result={'disclaimer':'确定性教学重算通过；不是模型或真实产品的评测结果。','rag':rag(),'memory':memory(),'cost':cost()}
    print(json.dumps(result,ensure_ascii=False,indent=2))
