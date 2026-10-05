import {onPageLoad} from './page-lifecycle';

/* 顶栏毛玻璃的开关。玻璃本身（backdrop-filter）常驻在 chrome.css 里，
   这里只负责在页面真的滚动之后补上底色：静止在页首时顶栏完全透明，
   背后的天空渐变不会被切出一条横带；一旦下滑，内容就被玻璃挡成雾面。
   阈值取 4px，避免移动端回弹/取整抖动导致底色闪烁。 */
const THRESHOLD = 4;
const ATTRIBUTE = 'data-header-scrolled';

const reflect = () => document.documentElement.toggleAttribute(ATTRIBUTE, window.scrollY > THRESHOLD);

onPageLoad((signal, onCleanup) => {
  reflect();
  addEventListener('scroll', reflect, {passive: true, signal});
  // 换页时滚动位置会回到顶端，属性必须跟着清掉，否则新页面会带着底色开局。
  onCleanup(() => document.documentElement.removeAttribute(ATTRIBUTE));
});
