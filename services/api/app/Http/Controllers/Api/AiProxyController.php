<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class AiProxyController extends Controller
{
    public function retentionAnalyze(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'totalEmployees' => ['required', 'integer', 'min:0'],
            'activeEmployees' => ['required', 'integer', 'min:0'],
            'attendanceRate' => ['required', 'numeric', 'between:0,100'],
            'avgLateMinutes' => ['required', 'numeric', 'min:0'],
            'absenceRate' => ['required', 'numeric', 'between:0,100'],
            'checkOutCompletionRate' => ['required', 'numeric', 'between:0,100'],
        ]);

        $aiUrl = rtrim(config('services.ai.url', env('AI_URL', 'http://localhost:8001')), '/');
        $apiKey = config('services.ai.key', env('AI_API_KEY', ''));

        if (! $aiUrl || ! $apiKey) {
            return response()->json(['success' => false, 'message' => 'AI service is not configured'], 503);
        }

        $cacheKey = 'ai.retention.'.md5(json_encode($validated));
        $cached = Cache::get($cacheKey);
        if ($cached) {
            return response()->json($cached);
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.$apiKey,
                'Accept' => 'application/json',
            ])
                ->connectTimeout(2)
                ->timeout(5)
                ->post($aiUrl.'/api/v1/retention/analyze', $validated);
        } catch (ConnectionException $e) {
            return response()->json(['success' => false, 'message' => 'AI service unavailable'], 503);
        }

        if (! $response->successful()) {
            return response()->json(['success' => false, 'message' => 'AI service returned an error'], $response->status());
        }

        $payload = $response->json();
        Cache::put($cacheKey, $payload, 60);

        return response()->json($payload);
    }
}
