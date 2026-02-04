<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{


    /**
     * Display a listing of the notifications.
     */
    public function index()
    {
        $user = User::where('id', Auth::id())
        ->first();

        $notifications = Notification::where('owner_id', $user->id)
            ->where('outlet_id', $user->current_outlet_id)
            ->latest()
            ->get();

        return inertia('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }


    /**
     * Mark a notification as read.
     */
    public function markAsRead($id)
    {
        $user = User::find(Auth::id());
        $notification = $user->notifications()->find($id);

        if ($notification) {
            $notification->markAsRead();
            return response()->json(['status' => 'success']);
        }

        return back()->withSuccess('All notifications marked as read.');
    }





    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead()
    {
        $user = User::find(Auth::id());

        $user->notifications()->where('status', 'unread')->update([
            'read_at' => now(),
            'status' => 'read'
        ]);

        return back()->withSuccess('All notifications marked as read.');
    }

    


    /**
     * Delete a notification.
     */
    public function delete($id)
    {
        $user = User::find(Auth::id());
        $notification = $user->notifications()->find($id);

        if ($notification) {
            $notification->delete();
            return back()->withSuccess('Notification deleted successfully.'
        );
        }

        return back()->withErrors('Notification not found.');
    }


    /**
     * Delete all read notifications.
     */
    public function deleteAllRead()
    {
        $user = User::find(Auth::id());

        $user->notifications()->where('status', 'read')->delete();

        return back()->withSuccess('All read notifications deleted successfully.');
    }
}
