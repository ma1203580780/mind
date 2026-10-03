import unittest,importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('enrich',Path(__file__).with_name('enrich-news.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class EnrichmentTest(unittest.TestCase):
 def test_translation_quality_gate(self):
  for text in ['标有'*100,'标有，'*10,None]:
   self.assertFalse(m.usable_translation(text,'A short source.'))
  self.assertFalse(m.usable_translation('English only','source'))
  self.assertTrue(m.usable_translation('比较逐字呈现与整张卡片展示的阅读体验。','Compare reading character by character and card by card.'))
 def test_rejects_generic_or_unsafe_images(self):
  for u in ['javascript:alert(1)','https://img.eeo.com.cn/pc/images/xd-smg.png','https://jg-app.obs.cn-north-4.myhuaweicloud.com/prod/upload/0/png/BF3FFD4CC4BD3331A55AD1DCE56D9C81.png','https://arxiv.org/static/base/images/funders/simons-foundation.png','https://avatars.githubusercontent.com/u/12?s=60','https://www.federalreserve.gov/images/USAGov%402x.png','https://x.org/logo.svg','https://img.eeo.com.cn/2024/images/card.png','https://x.org/ECB place holder.jpg']:
   self.assertIsNone(m.image_url(u,'https://x.org/article'))
  self.assertEqual(m.image_url('/figures/result.png','https://arxiv.org/html/1/'),'https://arxiv.org/figures/result.png')
 def test_paper_uses_figures_not_site_images(self):
  p=m.ArticleMeta('https://arxiv.org/html/2610.01/')
  p.feed('<meta property="og:image" content="https://x.org/random.jpg"><img src="https://x.org/header.png"><figure><img src="plots/results.png" alt="Experimental results"></figure>')
  self.assertEqual(len(p.images),1);self.assertIn('plots/results.png',p.images[0][1])
 def test_source_languages(self):
  self.assertEqual(m.language('中文资讯和经济'),'zh');self.assertEqual(m.language('Central bank research'),'en')
if __name__=='__main__':unittest.main()
