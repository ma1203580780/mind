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
  self.assertEqual(len(c.select(rows,set(),now)),70)
  self.assertEqual(len(c.select(rows,{'https://example.org/0'},now,3)),3)
  self.assertEqual(c.select([dict(rows[0],published=now+dt.timedelta(hours=1))],set(),now),[])
  self.assertEqual(c.select([dict(rows[0],published=now-dt.timedelta(days=4))],set(),now),[])
  self.assertEqual(len(c.select([rows[0],rows[0]],set(),now)),1)
if __name__=='__main__':unittest.main()
