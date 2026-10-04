export const BLOG_CATEGORIES = ['AI 工程', '产品与交互', '独立创造', '思考与成长'] as const;
export const blogCategories = BLOG_CATEGORIES.map((name, index) => ({
  name, slug: ['ai-engineering', 'product-interaction', 'independent-creation', 'thinking-growth'][index],
}));
export const blogCategoryRoute = (name: string) => `archive/category/${blogCategories.find(category => category.name === name)!.slug}/`;
