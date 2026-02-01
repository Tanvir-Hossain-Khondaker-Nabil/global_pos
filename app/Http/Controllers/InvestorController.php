<?php

namespace App\Http\Controllers;

use App\Models\Investor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InvestorController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->get('search', ''));
        $status = $request->get('status', 'all'); // all|active|inactive

        $investors = Investor::query()
            ->when($q, function ($query) use ($q) {
                $query->where(function ($qq) use ($q) {
                    $qq->where('name', 'like', "%{$q}%")
                       ->orWhere('phone', 'like', "%{$q}%")
                       ->orWhere('email', 'like', "%{$q}%");
                });
            })
            ->when($status !== 'all', function ($query) use ($status) {
                $query->where('is_active', $status === 'active');
            })
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn ($i) => [
                'id' => $i->id,
                'name' => $i->name,
                'phone' => $i->phone,
                'email' => $i->email,
                'address' => $i->address,
                'is_active' => (bool) $i->is_active,
                'created_at' => $i->created_at?->format('d M Y'),
            ]);

        return Inertia::render('Investors/Index', [
            'filters' => [
                'search' => $q,
                'status' => $status,
            ],
            'investors' => $investors,
        ]);
    }

    public function create()
    {
        return Inertia::render('Investors/Create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        Investor::create($data); // created_by auto (BelongsToCreator trait)

        return to_route('investors.index')->with('success', 'Investor created successfully!');
    }

    public function edit(Investor $investor)
    {
        return Inertia::render('Investors/Edit', [
            'investor' => [
                'id' => $investor->id,
                'name' => $investor->name,
                'phone' => $investor->phone,
                'email' => $investor->email,
                'address' => $investor->address,
                'is_active' => (bool) $investor->is_active,
            ],
        ]);
    }

    public function update(Request $request, Investor $investor)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $investor->update($data);

        return to_route('investors.index')->with('success', 'Investor updated successfully!');
    }

    public function destroy(Investor $investor)
    {
        // যদি investor-এর investment থাকে, delete ব্লক করতে পারেন:
        if ($investor->investments()->exists()) {
            return back()->with('error', 'This investor has investments. You cannot delete.');
        }

        $investor->delete();

        return back()->with('success', 'Investor deleted successfully!');
    }
}
