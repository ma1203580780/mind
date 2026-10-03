// Keep portable /uploads URLs in Markdown; respect the deployment base at render time.
export default function remarkUploads({base='/'}={}) {
  const prefix = base.replace(/\/$/, '');
  return function transform(tree) {
    function walk(node) {
      if (['image', 'link', 'definition'].includes(node.type) && node.url?.startsWith('/uploads/')) {
        node.url = `${prefix}${node.url}`;
      }
      node.children?.forEach(walk);
    }
    walk(tree);
  };
}
