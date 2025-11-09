import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);

        console.log('Test URL API: Full URL:', url.toString());
        console.log('Test URL API: Pathname:', url.pathname);
        console.log('Test URL API: Search:', url.search);
        console.log('Test URL API: Hash:', url.hash);

        // Extract post ID from pathname
        const postMatch = url.pathname.match(/\/post\/([^\/\?]+)/);
        const extractedPostId = postMatch ? postMatch[1] : null;

        console.log('Test URL API: Extracted post ID:', extractedPostId);

        // Test URL decoding
        const decodedPostId = extractedPostId ? decodeURIComponent(extractedPostId) : null;
        console.log('Test URL API: Decoded post ID:', decodedPostId);

        // Test cleaning
        const cleanedPostId = decodedPostId ? decodedPostId.replace(/%5B|%5D/g, '').replace(/\[|\]/g, '') : null;
        console.log('Test URL API: Cleaned post ID:', cleanedPostId);

        return NextResponse.json({
            success: true,
            url: {
                full: url.toString(),
                pathname: url.pathname,
                search: url.search,
                hash: url.hash
            },
            postId: {
                extracted: extractedPostId,
                decoded: decodedPostId,
                cleaned: cleanedPostId
            }
        });
    } catch (error) {
        console.error('Test URL API: Error:', error);
        return NextResponse.json(
            { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 