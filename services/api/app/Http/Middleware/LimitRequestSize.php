<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LimitRequestSize
{
    public function handle(Request $request, Closure $next, int $maxKb = 512): Response
    {
        $contentLength = (int) ($request->header('Content-Length') ?? '0');

        if ($contentLength > $maxKb * 1024) {
            return response()->json([
                'success' => false,
                'message' => "Request body exceeds maximum allowed size of {$maxKb}KB.",
            ], 413);
        }

        return $next($request);
    }
}
