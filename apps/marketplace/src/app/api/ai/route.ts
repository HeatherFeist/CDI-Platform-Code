import { NextRequest, NextResponse } from 'next/server';
import { googleAIService } from '../../../services/GoogleAIService';

// Rate limiting map
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(ip) || [];
  
  // Remove old requests
  const validRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (validRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  validRequests.push(now);
  rateLimitMap.set(ip, validRequests);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1';

    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { action, data } = body;

    // Validate request
    if (!action) {
      return NextResponse.json(
        { error: 'Missing action parameter' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'generate-listing':
        if (!data.title) {
          return NextResponse.json(
            { error: 'Missing required field: title' },
            { status: 400 }
          );
        }
        result = await googleAIService.generateProductListing(data);
        break;

      case 'analyze-image':
        if (!data.imageBase64) {
          return NextResponse.json(
            { error: 'Missing required field: imageBase64' },
            { status: 400 }
          );
        }
        result = await googleAIService.analyzeProductImage(
          data.imageBase64,
          data.context
        );
        break;

      case 'chat-response':
        if (!data.message) {
          return NextResponse.json(
            { error: 'Missing required field: message' },
            { status: 400 }
          );
        }
        result = await googleAIService.getChatResponse(
          data.message,
          data.context
        );
        break;

      case 'optimize-price':
        if (!data.title || !data.category) {
          return NextResponse.json(
            { error: 'Missing required fields: title, category' },
            { status: 400 }
          );
        }
        result = await googleAIService.suggestOptimalPrice(data);
        break;

      case 'generate-seo':
        if (!data.title || !data.category) {
          return NextResponse.json(
            { error: 'Missing required fields: title, category' },
            { status: 400 }
          );
        }
        // SEO content generation not available in GoogleAIService yet
        result = { error: 'SEO content generation not available with current AI service' };
        break;

      case 'batch-analyze':
        if (!data.images || !Array.isArray(data.images)) {
          return NextResponse.json(
            { error: 'Missing or invalid field: images' },
            { status: 400 }
          );
        }
        // Batch image analysis not available in GoogleAIService yet  
        result = { error: 'Batch image analysis not available with current AI service' };
        break;

      case 'usage-stats':
        result = await googleAIService.getUsageStats();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing AI request:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { 
            error: 'AI service quota exceeded. Please try again later.',
            code: 'QUOTA_EXCEEDED'
          },
          { status: 429 }
        );
      }
      
      if (error.message.includes('authentication')) {
        return NextResponse.json(
          { 
            error: 'AI service authentication failed.',
            code: 'AUTH_FAILED'
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'AI service temporarily unavailable. Please try again.',
        code: 'SERVICE_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const stats = await googleAIService.getUsageStats();
    
    return NextResponse.json({
      service: 'Vertex AI API',
      status: 'active',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { 
        service: 'Vertex AI API',
        status: 'error',
        error: 'Service health check failed'
      },
      { status: 500 }
    );
  }
}