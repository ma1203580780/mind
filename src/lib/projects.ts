import snapshot from '../data/github-projects.json';
export const githubProjects=snapshot.repos.filter(repo=>repo.name==='mind'&&!repo.fork);
export const projectsCheckedAt=snapshot.checkedAt;
export const kancloud={name:'看云 · 技术写作',url:'https://www.kancloud.cn/@martist',description:'技术知识与实践经验，整理为可以持续阅读的文档与专栏。',tags:['订阅过千','付费过万','单日 PV 10 万']};
