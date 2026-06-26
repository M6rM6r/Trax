<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureCompanyActive
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user || !$user->company_id) {
            return response()->json(['success' => false, 'message' => 'No company associated with this account.'], 403);
        }

        $company = $user->company;

        if (!$company || !$company->active) {
            return response()->json(['success' => false, 'message' => 'Company account is suspended.'], 403);
        }

        if ($company->isTrialExpired()) {
            return response()->json(['success' => false, 'message' => 'Trial period has ended. Please upgrade your plan.'], 402);
        }

        // Inject company into request for easy access in controllers
        $request->merge(['_company' => $company]);

        return $next($request);
    }
}
