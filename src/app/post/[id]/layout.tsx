import { Metadata } from 'next';

interface PostLayoutProps {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PostLayoutProps): Promise<Metadata> {
    const { id: postId } = await params;

    return {
        title: `پست Vista - ${postId}`,
        description: 'پست Vista - پلتفرم اجتماعی',
        openGraph: {
            title: 'پست Vista',
            description: 'پست Vista - پلتفرم اجتماعی',
            url: `https://coffevista.ir/post/${postId}`,
            type: 'article',
            siteName: 'Vista',
        },
        twitter: {
            card: 'summary_large_image',
            title: 'پست Vista',
            description: 'پست Vista - پلتفرم اجتماعی',
        },
        alternates: {
            canonical: `https://coffevista.ir/post/${postId}`,
        },
    };
}

export default function PostLayout({ children }: PostLayoutProps) {
    return <>{children}</>;
} 