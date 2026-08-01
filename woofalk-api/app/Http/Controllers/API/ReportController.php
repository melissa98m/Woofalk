<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\Response;

class ReportController extends Controller
{
    /**
     * Display every report across places/ballades/hebergements, most recent
     * first, for the admin "Signalements" moderation tab.
     *
     * @return Response
     */
    public function index()
    {
        $reports = Report::with(['reportable', 'user:id,username'])
            ->latest()
            ->get();

        return response()->json([
            'status' => 'Success',
            'data' => $reports,
        ]);
    }

    /**
     * Mark a report as reviewed. Does not change the reported listing's
     * moderation status — republishing it stays a separate action via the
     * existing place/ballade/hebergement bulk-status endpoints.
     *
     * @return Response
     */
    public function dismiss(Report $report)
    {
        $report->resolved_at = now();
        $report->save();

        return response()->json([
            'status' => 'Success',
            'data' => $report,
        ]);
    }
}
