import unittest, importlib.util, datetime as dt
from pathlib import Path
spec=importlib.util.spec_from_file_location('collector',Path(__file__).with_name('collect-news.py')); c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
class CollectorTest(unittest.TestCase):
 def test_rss_atom_and_unsafe(self):
  rss=b'<rss><channel><item><title>A &amp; B</title><link>https://example.org/a?utm_source=x</link><pubDate>Fri, 02 Oct 2026 00:00:00 GMT</pubDate><description>&lt;b&gt;real&lt;/b&gt;</description></item></channel></rss>'
  x=c.parse_feed(rss)[0];self.assertEqual(x['url'],'https://example.org/a');self.assertEqual(x['excerpt'],'real')
  atom=b'<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Release</title><link href="https://github.com/a/b/releases/tag/v1"/><updated>2026-10-02T00:00:00Z</updated></entry></feed>'
  self.assertEqual(len(c.parse_feed(atom)),1)
  with self.assertRaises(ValueError):c.parse_feed(b'<!DOCTYPE rss><rss/>')
  self.assertIsNone(c.canonical('javascript:alert(1)'))
 def test_freshness_dedup_caps(self):
  now=dt.datetime(2026,10,2,tzinfo=c.UTC);s=dict(id='a',domain='AI',kind='论文预印本',maxItems=100)
  rows=[dict(title=f'paper {i}',url=f'https://example.org/{i}',published=now,source=s) for i in range(220)]
  self.assertEqual(len(c.select(rows,set(),now)),30)
  self.assertEqual(len(c.select(rows,{'https://example.org/0'},now,3)),3)
  self.assertEqual(c.select([dict(rows[0],published=now+dt.timedelta(hours=1))],set(),now),[])
  self.assertEqual(c.select([dict(rows[0],published=now-dt.timedelta(days=4))],set(),now),[])
  self.assertEqual(len(c.select([rows[0],rows[0]],set(),now)),1)
 def test_topics_new_sources_and_existing_day_balance(self):
  now=dt.datetime(2026,10,3,tzinfo=c.UTC)
  def row(n,topic,**kw):return dict(title=n,url='https://example.org/'+n,published=now,excerpt='',source=dict(id=topic,domain=topic,category=topic,kind='实践',maxItems=100,**kw))
  rows=[row('ai'+str(i),'AI 资讯') for i in range(80)]+[row('design','产品设计'),row('solo','一人公司'),row('econ','经济观察')]
  existing=[dict(title='previous'+str(i),category='AI 动态',sourceId='old') for i in range(10)]
  chosen=c.select(rows,set(),now,3,existing)
  self.assertEqual({r['source']['category'] for r in chosen},{'产品设计','一人公司','经济观察'})
  self.assertEqual(c.select(rows,set(),now,0),[])
  weekly=row('weekly','一人公司',maxAgeHours=168);weekly['published']=now-dt.timedelta(days=5)
  self.assertEqual(len(c.select([weekly],set(),now)),1)
  self.assertEqual(c.select([weekly],{weekly['url']},now),[])
  weekly['published']=now-dt.timedelta(days=8)
  self.assertEqual(c.select([weekly],set(),now),[])
 def test_cdata_html_is_text_but_real_dtd_still_rejected(self):
  feed=b'<rss><channel><item><title>UX &nbsp; Research</title><link>https://example.org/story</link><pubDate>Fri, 02 Oct 2026 00:00:00 GMT</pubDate><description><![CDATA[<!DOCTYPE html><p>Actual excerpt</p>]]></description></item></channel></rss>'
  self.assertEqual(c.parse_feed(feed)[0]['excerpt'],'Actual excerpt')
  with self.assertRaises(ValueError):c.parse_feed(b'<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///etc/passwd">]><rss/>')
 def test_publisher_footer_does_not_become_news_summary(self):
  feed=b'<rss><channel><item><title>Art study</title><link>https://example.org/art</link><pubDate>Fri, 02 Oct 2026 00:00:00 GMT</pubDate><description>Actual art excerpt. Do stories and artists like this matter to you? Become a Colossal Member today for $7 per month. The article Art study appeared first on Colossal.</description></item></channel></rss>'
  self.assertEqual(c.parse_feed(feed)[0]['excerpt'],'Actual art excerpt.')
if __name__=='__main__':unittest.main()
