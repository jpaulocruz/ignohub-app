import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const locales = ['pt', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt';

export default getRequestConfig(async () => {
    const cookieStore = await cookies();
    const headerStore = await headers();

    // 1. Check cookie
    let locale = cookieStore.get('locale')?.value as Locale | undefined;

    // 2. Fallback: Accept-Language header
    if (!locale || !locales.includes(locale)) {
        const acceptLang = headerStore.get('accept-language') || '';
        if (acceptLang.includes('en')) {
            locale = 'en';
        } else {
            locale = defaultLocale;
        }
    }

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default,
    };
});
