import {onPageLoad} from './page-lifecycle';
import {mountPoolBackground} from '../lib/pool-background.mjs';

onPageLoad((_signal,onCleanup)=>{
 const host=document.querySelector('[data-pool]');
 if(host)onCleanup(mountPoolBackground(host));
});
