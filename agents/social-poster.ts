/**
 * Social Media Poster
 * ───────────────────
 * Actually posts content to Instagram and Facebook using Meta Graph API.
 *
 * Requirements:
 *   1. A Facebook Page linked to your business
 *   2. An Instagram Business/Creator account connected to that Facebook Page
 *   3. A Meta App with permissions: pages_manage_posts, instagram_basic, instagram_content_publish
 *   4. A Page Access Token (long-lived, never-expiring)
 *
 * How to get credentials:
 *   1. Go to https://developers.facebook.com → Create App → Business type
 *   2. Add "Instagram Graph API" and "Pages API" products
 *   3. Generate a Page Access Token via Graph API Explorer
 *   4. Get your Instagram Business Account ID: 
 *      GET /{page-id}?fields=instagram_business_account → gives you the IG account ID
 *   5. Add tokens to .env.local
 */

import fs from 'fs/promises';
import { BRAND } from './config.js';
import { log, retryWithBackoff } from './utils.js';

// ─── Config ──────────────────────────────────────────────────────────
const META_PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN || '';
const META_PAGE_ID = process.env.META_PAGE_ID || '';
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID || '';

export function isMetaConfigured(): boolean {
    return !!(META_PAGE_ACCESS_TOKEN && META_PAGE_ID);
}

export function isInstagramConfigured(): boolean {
    return !!(META_PAGE_ACCESS_TOKEN && INSTAGRAM_ACCOUNT_ID);
}

// ─── Facebook Posting ────────────────────────────────────────────────

/**
 * Post an image with caption to a Facebook Page.
 */
export async function postToFacebook(
    imageUrl: string,
    caption: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
    if (!isMetaConfigured()) {
        return { success: false, error: 'META_PAGE_ACCESS_TOKEN or META_PAGE_ID not set in .env.local' };
    }

    try {
        // Facebook Pages API — post a photo with a message
        const url = `https://graph.facebook.com/v19.0/${META_PAGE_ID}/photos`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: imageUrl, // Must be a publicly accessible URL (Cloudinary URL works)
                message: caption,
                access_token: META_PAGE_ACCESS_TOKEN,
            }),
        });

        const data = await response.json() as { id?: string; error?: { message: string } };

        if (data.error) {
            log('social-poster', 'ERROR', `Facebook post failed: ${data.error.message}`);
            return { success: false, error: data.error.message };
        }

        log('social-poster', 'SUCCESS', `Posted to Facebook! Post ID: ${data.id}`);
        return { success: true, postId: data.id };
    } catch (error) {
        const msg = (error as Error).message;
        log('social-poster', 'ERROR', `Facebook post failed: ${msg}`);
        return { success: false, error: msg };
    }
}

/**
 * Post a text status (no image) to Facebook Page.
 */
export async function postTextToFacebook(
    message: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
    if (!isMetaConfigured()) {
        return { success: false, error: 'META_PAGE_ACCESS_TOKEN or META_PAGE_ID not set' };
    }

    try {
        const url = `https://graph.facebook.com/v19.0/${META_PAGE_ID}/feed`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                access_token: META_PAGE_ACCESS_TOKEN,
            }),
        });

        const data = await response.json() as { id?: string; error?: { message: string } };

        if (data.error) {
            return { success: false, error: data.error.message };
        }

        log('social-poster', 'SUCCESS', `Text posted to Facebook! Post ID: ${data.id}`);
        return { success: true, postId: data.id };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

// ─── Instagram Posting ───────────────────────────────────────────────

/**
 * Post an image with caption to Instagram Business Account.
 * 
 * Instagram Content Publishing API is a 2-step process:
 *   Step 1: Create a media container
 *   Step 2: Publish the container
 */
export async function postToInstagram(
    imageUrl: string,
    caption: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
    if (!isInstagramConfigured()) {
        return { success: false, error: 'META_PAGE_ACCESS_TOKEN or INSTAGRAM_ACCOUNT_ID not set in .env.local' };
    }

    try {
        // Step 1: Create media container
        const createUrl = `https://graph.facebook.com/v19.0/${INSTAGRAM_ACCOUNT_ID}/media`;
        const createResponse = await fetch(createUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image_url: imageUrl, // Must be a publicly accessible URL
                caption,
                access_token: META_PAGE_ACCESS_TOKEN,
            }),
        });

        const createData = await createResponse.json() as { id?: string; error?: { message: string } };

        if (createData.error) {
            log('social-poster', 'ERROR', `Instagram container creation failed: ${createData.error.message}`);
            return { success: false, error: createData.error.message };
        }

        const containerId = createData.id;
        if (!containerId) {
            return { success: false, error: 'No container ID returned' };
        }

        log('social-poster', 'INFO', `Instagram media container created: ${containerId}`);

        // Wait a moment for Instagram to process the image
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Step 2: Publish the container
        const publishUrl = `https://graph.facebook.com/v19.0/${INSTAGRAM_ACCOUNT_ID}/media_publish`;
        const publishResponse = await fetch(publishUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                creation_id: containerId,
                access_token: META_PAGE_ACCESS_TOKEN,
            }),
        });

        const publishData = await publishResponse.json() as { id?: string; error?: { message: string } };

        if (publishData.error) {
            log('social-poster', 'ERROR', `Instagram publish failed: ${publishData.error.message}`);
            return { success: false, error: publishData.error.message };
        }

        log('social-poster', 'SUCCESS', `Posted to Instagram! Post ID: ${publishData.id}`);
        return { success: true, postId: publishData.id };
    } catch (error) {
        const msg = (error as Error).message;
        log('social-poster', 'ERROR', `Instagram post failed: ${msg}`);
        return { success: false, error: msg };
    }
}

/**
 * Post a carousel (multiple images) to Instagram.
 */
export async function postCarouselToInstagram(
    imageUrls: string[],
    caption: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
    if (!isInstagramConfigured()) {
        return { success: false, error: 'Instagram not configured' };
    }

    if (imageUrls.length < 2 || imageUrls.length > 10) {
        return { success: false, error: 'Carousel requires 2-10 images' };
    }

    try {
        // Step 1: Create individual media containers for each image
        const childIds: string[] = [];
        for (const imageUrl of imageUrls) {
            const createUrl = `https://graph.facebook.com/v19.0/${INSTAGRAM_ACCOUNT_ID}/media`;
            const response = await fetch(createUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_url: imageUrl,
                    is_carousel_item: true,
                    access_token: META_PAGE_ACCESS_TOKEN,
                }),
            });

            const data = await response.json() as { id?: string; error?: { message: string } };
            if (data.error) {
                log('social-poster', 'WARN', `Carousel item failed: ${data.error.message}`);
                continue;
            }
            if (data.id) childIds.push(data.id);
        }

        if (childIds.length < 2) {
            return { success: false, error: 'Need at least 2 successful carousel items' };
        }

        // Step 2: Create carousel container
        const carouselUrl = `https://graph.facebook.com/v19.0/${INSTAGRAM_ACCOUNT_ID}/media`;
        const carouselResponse = await fetch(carouselUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                media_type: 'CAROUSEL',
                children: childIds,
                caption,
                access_token: META_PAGE_ACCESS_TOKEN,
            }),
        });

        const carouselData = await carouselResponse.json() as { id?: string; error?: { message: string } };
        if (carouselData.error) {
            return { success: false, error: carouselData.error.message };
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Step 3: Publish
        const publishUrl = `https://graph.facebook.com/v19.0/${INSTAGRAM_ACCOUNT_ID}/media_publish`;
        const publishResponse = await fetch(publishUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                creation_id: carouselData.id,
                access_token: META_PAGE_ACCESS_TOKEN,
            }),
        });

        const publishData = await publishResponse.json() as { id?: string; error?: { message: string } };
        if (publishData.error) {
            return { success: false, error: publishData.error.message };
        }

        log('social-poster', 'SUCCESS', `Carousel posted to Instagram! Post ID: ${publishData.id}`);
        return { success: true, postId: publishData.id };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

// ─── Batch Post for a Product ────────────────────────────────────────

export interface PostResult {
    platform: 'instagram' | 'facebook';
    success: boolean;
    postId?: string;
    error?: string;
}

/**
 * Post a product to all configured platforms at once.
 * Uses Cloudinary URL (publicly accessible) as the image source.
 */
export async function postProductToAllPlatforms(
    imageUrl: string,
    instagramCaption: string,
    facebookCaption: string
): Promise<PostResult[]> {
    const results: PostResult[] = [];

    // Post to Instagram
    if (isInstagramConfigured()) {
        const igResult = await postToInstagram(imageUrl, instagramCaption);
        results.push({ platform: 'instagram', ...igResult });
    } else {
        results.push({ platform: 'instagram', success: false, error: 'Instagram not configured — set INSTAGRAM_ACCOUNT_ID in .env.local' });
    }

    // Post to Facebook
    if (isMetaConfigured()) {
        const fbResult = await postToFacebook(imageUrl, facebookCaption);
        results.push({ platform: 'facebook', ...fbResult });
    } else {
        results.push({ platform: 'facebook', success: false, error: 'Facebook not configured — set META_PAGE_ID in .env.local' });
    }

    return results;
}
