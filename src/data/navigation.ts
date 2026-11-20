// Main navigation, in the approved order. Labels follow the UI design.
import departmentData from './departments.json';

export const departments = departmentData.map((d) => ({ slug: d.slug, name: d.name, summary: d.summary }));

export const libraryCategories = [
  { href: '/library/messages', name: 'Messages and Sermons', summary: 'Latest messages, archive and series' },
  { href: '/library/music', name: 'Music and Songs', summary: 'Church music and worship songs' },
  { href: '/library/live', name: 'Live Services', summary: 'YouTube Live and other streams' },
  { href: '/library/connect', name: 'Online Connections', summary: 'Telegram and official platforms' },
  { href: '/library/gallery', name: 'Gallery', summary: 'Photos and videos by occasion' },
  { href: '/library/resources', name: 'Publications and Resources', summary: 'Articles, downloads, devotionals' },
  { href: '/library/books', name: 'Recommended Books', summary: 'Books recommended by leadership' },
];

export type NavItem = { label: string; href: string; menu?: 'departments' | 'library' };

export const mainNav: NavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Departments', href: '/departments', menu: 'departments' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'Digital Library', href: '/library', menu: 'library' },
  { label: 'Giving', href: '/give' },
  { label: 'Testimonies', href: '/testimonies' },
  { label: 'Contact', href: '/contact' },
];

export const footerNav = {
  Church: [
    { label: 'About GMI', href: '/about' },
    { label: 'Our Services', href: '/services' },
    { label: 'Departments', href: '/departments' },
    { label: 'Testimonies', href: '/testimonies' },
  ],
  Connect: [
    { label: 'New Here', href: '/new-here' },
    { label: 'Plan Your Visit', href: '/plan-your-visit' },
    { label: 'Church Calendar', href: '/calendar' },
    { label: 'Contact & FAQ', href: '/contact' },
  ],
  Resources: [
    { label: 'Digital Library', href: '/library' },
    { label: 'Watch Live', href: '/library/live' },
    { label: 'Giving & Partnership', href: '/give' },
  ],
};

export const legalNav = [
  { label: 'Privacy Policy', href: '/policies/privacy' },
  { label: 'Terms and Conditions', href: '/policies/terms' },
  { label: 'Cookie Policy', href: '/policies/cookies' },
  { label: 'Accessibility Statement', href: '/policies/accessibility' },
];
