<?php

namespace App\Http\Controllers;

use App\Models\School;
use Illuminate\Http\Request;

class SchoolPublicController extends Controller
{
    /**
     * GET /api/schools
     * List active schools for the public searchable dropdown.
     */
    public function index(Request $request)
    {
        $search = $request->query('search', $request->query('q', ''));

        $schools = School::active()
            ->search($search)
            ->select(['id', 'npsn', 'name', 'slug', 'city', 'province', 'logo'])
            ->orderBy('name', 'asc')
            ->limit(50)
            ->get();

        return response()->json($schools);
    }

    /**
     * GET /api/schools/{id}
     * Get basic info of a single school.
     */
    public function show(int $id)
    {
        $school = School::active()
            ->select(['id', 'npsn', 'name', 'slug', 'address', 'city', 'province', 'phone', 'email', 'website', 'logo'])
            ->findOrFail($id);

        return response()->json($school);
    }
}
