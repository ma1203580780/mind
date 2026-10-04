import discover from '../data/discover.json';
export {discover};
export const statusLabels: Record<string,string> = {active:'正在构建',exploring:'探索中',maintained:'持续维护',paused:'暂缓',published:'已发布'};
// V2.0 uses Issues until the owner explicitly configures a live Discussions destination.
export function discussionUrl(title='想聊聊：一个具体的问题', context='') {
 if(discover.discussionsUrl) return discover.discussionsUrl;
 const query=new URLSearchParams({title,body:[context,'想交流的问题：','我已经尝试过：','相关链接或例子：'].filter(Boolean).join('\n\n')});
 return `${discover.repository}/issues/new?${query}`;
}
