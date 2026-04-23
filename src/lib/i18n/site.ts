export type Locale = 'en' | 'pt';

export function getLocaleFromPathname(pathname: string): Locale {
	return pathname === '/pt' || pathname.startsWith('/pt/') ? 'pt' : 'en';
}

export function stripLocalePrefix(pathname: string) {
	if (pathname === '/pt') return '/';
	if (pathname.startsWith('/pt/')) return pathname.slice(3) || '/';
	return pathname || '/';
}

const localizedPaths = new Set([
	'/',
	'/manifesto'
]);

export function getTopLevelLocalizedPath(pathname: string, targetLocale: Locale) {
	const basePath = stripLocalePrefix(pathname);

	let destination = '/';
	if (localizedPaths.has(basePath)) {
		destination = basePath;
	} else if (basePath.startsWith('/manifesto')) {
		destination = '/manifesto';
	}

	if (targetLocale === 'en') return destination;
	return destination === '/' ? '/pt' : `/pt${destination}`;
}
