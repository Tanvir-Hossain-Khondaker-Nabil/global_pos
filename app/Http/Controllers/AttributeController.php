<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Attribute;
use App\Models\AttributeValue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AttributeController extends Controller
{
    // Index page with all attributes
    public function index()
    {
        return Inertia::render('Attributes/AttributeIndex', [
            'attributes' => Attribute::with([
                'values' => function ($query) {
                    $query->where('is_active', true);
                }
            ])->when(request('search'), function ($query) {
                $query->where(function ($query) {
                    $query->where('name', 'like', '%' . request('search') . '%')
                        ->orWhere('code', 'like', '%' . request('search') . '%');
                });
            })->paginate(10)
                ->withQueryString()
        ]);
    }


    // Store new attribute with values
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'values' => 'required|array|min:1',
            'values.*.value' => 'required|string|max:255',
        ]);

        DB::beginTransaction();
        try {

            $lastId = Attribute::max('id') + 1;

            // Create attribute
            $attribute = Attribute::create([
                'name' => $request->name,
                'code' => Str::slug($request->name) . '-' . Str::upper(Str::random(6)) . $lastId,
                'created_by' => Auth::id(),
            ]);

            // Create attribute values
            foreach ($request->values as $valueData) {
                AttributeValue::create([
                    'attribute_id' => $attribute->id,
                    'value' => $valueData['value'],
                    'code' => Str::slug($valueData['value']) . '-' . Str::upper(Str::random(6)) . $lastId,
                ]);
            }

            DB::commit();

            return redirect()->back()->with('success', 'Attribute created successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to create attribute: ' . $e->getMessage());
        }
    }

    // Update attribute and its values
    public function update(Request $request, Attribute $attribute)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:attributes,name,' . $attribute->id,
            'values' => 'required|array|min:1',
            'values.*.value' => 'required|string|max:255',
        ]);

        DB::beginTransaction();
        try {

            $lastId = $attribute->id; // store() এর মতো consistency

            // Update attribute
            $attribute->update([
                'name' => $request->name,
                'code' => Str::slug($request->name) . '-' . Str::upper(Str::random(6)) . $lastId,
            ]);

            $existingValueIds = [];

            foreach ($request->values as $valueData) {

                // Update existing value
                if (!empty($valueData['id'])) {
                    $value = AttributeValue::where('id', $valueData['id'])
                        ->where('attribute_id', $attribute->id)
                        ->first();

                    if ($value) {
                        $value->update([
                            'value' => $valueData['value'],
                            'code' => Str::slug($valueData['value']) . '-' . Str::upper(Str::random(6)) . $lastId,
                            'is_active' => true, // reactivate if previously disabled
                        ]);

                        $existingValueIds[] = $value->id;
                    }
                }
                // Create new value
                else {
                    $value = AttributeValue::create([
                        'attribute_id' => $attribute->id,
                        'value' => $valueData['value'],
                        'code' => Str::slug($valueData['value']) . '-' . Str::upper(Str::random(6)) . $lastId,
                        'is_active' => true,
                    ]);

                    $existingValueIds[] = $value->id;
                }
            }

            // Soft delete removed values
            AttributeValue::where('attribute_id', $attribute->id)
                ->whereNotIn('id', $existingValueIds)
                ->update(['is_active' => false]);

            DB::commit();

            return redirect()->back()->with('success', 'Attribute updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to update attribute: ' . $e->getMessage());
        }
    }


    // Store new value for existing attribute
    public function storeValue(Request $request, Attribute $attribute)
    {
        $request->validate([
            'value' => 'required|string|max:255',
            'code' => 'required|string|max:255|unique:attribute_values,code',
        ]);

        try {
            AttributeValue::create([
                'attribute_id' => $attribute->id,
                'value' => $request->value,
                'code' => $request->code,
            ]);

            return redirect()->back()->with('success', 'Value added successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to add value: ' . $e->getMessage());
        }
    }

    // Delete attribute
    public function destroy(Attribute $attribute)
    {
        DB::beginTransaction();
        try {
            // Soft delete all values first
            AttributeValue::where('attribute_id', $attribute->id)->update(['is_active' => false]);

            // Then delete attribute
            $attribute->delete();

            DB::commit();

            return redirect()->back()->with('success', 'Attribute deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to delete attribute: ' . $e->getMessage());
        }
    }

    // Delete attribute value
    public function destroyValue(Attribute $attribute, AttributeValue $value)
    {
        try {
            // Ensure the value belongs to the attribute
            if ($value->attribute_id !== $attribute->id) {
                return redirect()->back()->with('error', 'Value not found for this attribute');
            }

            $value->update(['is_active' => false]);

            return redirect()->back()->with('success', 'Value deleted successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to delete value: ' . $e->getMessage());
        }
    }
}
