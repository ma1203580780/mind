import {test} from 'node:test';
import assert from 'node:assert/strict';
import remarkUploads from './remark-uploads.mjs';

test('uploaded images, downloads and reference definitions follow the deployment base',()=>{
  const tree={type:'root',children:['image','link','definition'].map(type=>({type,url:'/uploads/hello%20world.png?x=1#image'}))};
  remarkUploads({base:'/mind/'})(tree);
  assert.ok(tree.children.every(n=>n.url==='/mind/uploads/hello%20world.png?x=1#image'));
});
test('root deployment and remote, relative, already prefixed URLs remain intact',()=>{
  const urls=['/uploads/a.png','https://example.com/a.png','//example.com/a.png','./a.png','/mind/uploads/a.png'];
  for (const base of ['/', '/mind']) {
    const tree={children:urls.map(url=>({type:'image',url}))};
    remarkUploads({base})(tree);
    assert.deepEqual(tree.children.map(n=>n.url),urls.map(u=>base==='/mind'&&u.startsWith('/uploads/')?'/mind'+u:u));
  }
});
