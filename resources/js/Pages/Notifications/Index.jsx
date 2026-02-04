import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { Bell, Eye, CheckCircle, Trash2, AlertTriangle, Clock, Calendar, Mail, Package , DollarSign } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

export default function NotificationIndex({ notifications, filters = {} }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();

    const searchForm = useForm({
        search: filters.search || "",
        type: filters.type || "",
        read_status: filters.read_status || "",
        start_date: filters.start_date || "",
        end_date: filters.end_date || "",
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        searchForm.setData(name, value);
    };

    const handleSubmit = (e) => {
        e?.preventDefault();
        router.get(route("notifications.index"), searchForm.data, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        searchForm.setData({
            search: "",
            type: "",
            read_status: "",
            start_date: "",
            end_date: "",
        });
        router.get(route("notifications.index"));
    };

    const handleMarkAsRead = (id) => {
        router.put(route("notifications.markAsRead", id), {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleMarkAllAsRead = () => {
        if (confirm(t('notification.mark_all_read_confirmation', 'Are you sure you want to mark all notifications as read?'))) {
            router.put(route("notifications.markAllAsRead"), {}, {
                preserveScroll: true,
                preserveState: true,
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm(t('notification.delete_confirmation', 'Are you sure you want to delete this notification?'))) {
            router.delete(route("notifications.destroy", id));
        }
    };

    const handleDeleteAllRead = () => {
        if (confirm(t('notification.delete_all_read_confirmation', 'Are you sure you want to delete all read notifications?'))) {
            router.delete(route("notifications.deleteAllRead"));
        }
    };

    const formatDate = (date) => {
        const notificationDate = new Date(date);
        const now = new Date();
        const diffTime = Math.abs(now - notificationDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffTime / (1000 * 60));

        if (diffMinutes < 60) {
            return `${diffMinutes} ${t('notification.minutes_ago', 'minutes ago')}`;
        } else if (diffHours < 24) {
            return `${diffHours} ${t('notification.hours_ago', 'hours ago')}`;
        } else if (diffDays < 7) {
            return `${diffDays} ${t('notification.days_ago', 'days ago')}`;
        } else {
            return notificationDate.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    };

    const formatDateTime = (date) => {
        return new Date(date).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Notification type options
    const notificationTypes = [
        { value: 'system', label: t('notification.type_system', 'System'), icon: Bell, color: 'badge-info' },
        { value: 'order', label: t('notification.type_order', 'Order'), icon: Package, color: 'badge-success' },
        { value: 'inventory', label: t('notification.type_inventory', 'Inventory'), icon: Package, color: 'badge-warning' },
        { value: 'payment', label: t('notification.type_payment', 'Payment'), icon: DollarSign, color: 'badge-accent' },
        { value: 'alert', label: t('notification.type_alert', 'Alert'), icon: AlertTriangle, color: 'badge-error' },
        { value: 'info', label: t('notification.type_info', 'Information'), icon: Mail, color: 'badge-primary' },
    ];

    const getNotificationType = (type) => {
        return notificationTypes.find(t => t.value === type) || notificationTypes[0];
    };

    const getReadStatusBadge = (read) => {
        return read ? 'badge-success' : 'badge-warning';
    };

    const truncateText = (text, length = 100) => {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    };

    const unreadCount = notifications.filter(n => !n.read_at).length;

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('notification.title', 'Notifications')}
                subtitle={t('notification.subtitle', 'Manage your system notifications')}
            >
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex gap-2">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <input
                                type="search"
                                name="search"
                                onChange={handleInputChange}
                                value={searchForm.data.search}
                                placeholder={t('notification.search_placeholder', 'Search notifications...')}
                                className="input input-sm input-bordered"
                            />
                            <button type="submit" className="btn btn-sm bg-[#1e4d2b] text-white">
                                {t('notification.search', 'Search')}
                            </button>
                        </form>

                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="btn btn-sm btn-success"
                            >
                                <CheckCircle size={15} />
                                {t('notification.mark_all_read', 'Mark All as Read')}
                            </button>
                        )}

                        <button
                            onClick={handleDeleteAllRead}
                            className="btn btn-sm btn-error"
                        >
                            <Trash2 size={15} />
                            {t('notification.delete_all_read', 'Delete Read')}
                        </button>
                    </div>
                </div>
            </PageHeader>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-figure text-primary">
                            <Bell size={24} />
                        </div>
                        <div className="stat-title">{t('notification.total', 'Total')}</div>
                        <div className="stat-value text-primary">{notifications.length}</div>
                    </div>
                </div>
                
                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-figure text-warning">
                            <Clock size={24} />
                        </div>
                        <div className="stat-title">{t('notification.unread', 'Unread')}</div>
                        <div className="stat-value text-warning">{unreadCount}</div>
                    </div>
                </div>
                
                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-figure text-success">
                            <CheckCircle size={24} />
                        </div>
                        <div className="stat-title">{t('notification.read', 'Read')}</div>
                        <div className="stat-value text-success">{notifications.length - unreadCount}</div>
                    </div>
                </div>
                
                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-figure text-error">
                            <AlertTriangle size={24} />
                        </div>
                        <div className="stat-title">{t('notification.today', 'Today')}</div>
                        <div className="stat-value text-error">
                            {notifications.filter(n => {
                                const date = new Date(n.created_at);
                                const today = new Date();
                                return date.toDateString() === today.toDateString();
                            }).length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <form onSubmit={handleSubmit}>
                <div className="bg-base-100 rounded-box p-4 mb-4 border border-base-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text text-sm">{t('notification.type', 'Notification Type')}</span>
                            </label>
                            <select
                                name="type"
                                onChange={handleInputChange}
                                value={searchForm.data.type}
                                className="select select-sm select-bordered"
                            >
                                <option value="">{t('notification.all_types', 'All Types')}</option>
                                {notificationTypes.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text text-sm">{t('notification.status', 'Read Status')}</span>
                            </label>
                            <select
                                name="read_status"
                                onChange={handleInputChange}
                                value={searchForm.data.read_status}
                                className="select select-sm select-bordered"
                            >
                                <option value="">{t('notification.all_status', 'All Status')}</option>
                                <option value="unread">{t('notification.unread_only', 'Unread Only')}</option>
                                <option value="read">{t('notification.read_only', 'Read Only')}</option>
                            </select>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text text-sm">{t('notification.start_date', 'Start Date')}</span>
                            </label>
                            <input
                                type="date"
                                name="start_date"
                                onChange={handleInputChange}
                                value={searchForm.data.start_date}
                                className="input input-sm input-bordered"
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text text-sm">{t('notification.end_date', 'End Date')}</span>
                            </label>
                            <input
                                type="date"
                                name="end_date"
                                onChange={handleInputChange}
                                value={searchForm.data.end_date}
                                className="input input-sm input-bordered"
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex justify-between">
                        <button
                            type="submit"
                            className="btn btn-sm bg-[#1e4d2b] text-white"
                        >
                            {t('notification.apply_filters', 'Apply Filters')}
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="btn btn-sm btn-ghost"
                        >
                            {t('notification.reset_filters', 'Reset Filters')}
                        </button>
                    </div>
                </div>
            </form>

            <div className="overflow-x-auto">
                {notifications.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-[#1e4d2b] text-white">
                            <tr>
                                <th className="bg-opacity-20">#</th>
                                <th>{t('notification.type', 'Type')}</th>
                                <th>{t('notification.message', 'Message')}</th>
                                <th>{t('notification.status', 'Status')}</th>
                                <th>{t('notification.date', 'Date')}</th>
                                <th>{t('notification.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notifications.map((notification, index) => {
                                const typeInfo = getNotificationType(notification.data?.type || 'system');
                                const TypeIcon = typeInfo.icon;
                                
                                return (
                                    <tr key={notification.id} className={`hover:bg-base-100 ${!notification.read_at ? 'bg-blue-50' : ''}`}>
                                        <th className="bg-base-200">
                                            {!notification.read_at && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            )}
                                            {index + 1}
                                        </th>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <TypeIcon size={16} className={typeInfo.color.replace('badge-', 'text-')} />
                                                <span className={`badge ${typeInfo.color}`}>
                                                    {typeInfo.label}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="max-w-md">
                                                <div className={`font-medium ${!notification.read_at ? 'font-semibold' : ''}`}>
                                                    {notification.data?.title || t('notification.no_title', 'No Title')}
                                                </div>
                                                <div className={`text-sm ${!notification.read_at ? 'text-gray-800' : 'text-gray-600'}`}>
                                                    {truncateText(notification.data?.message || notification.data?.body || t('notification.no_message', 'No message content'), 120)}
                                                </div>
                                                {notification.data?.link && (
                                                    <div className="text-xs text-primary mt-1">
                                                        <Link href={notification.data.link} className="hover:underline">
                                                            {t('notification.view_details', 'View details')} →
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${getReadStatusBadge(notification.read_at)}`}>
                                                {notification.read_at 
                                                    ? t('notification.read_status', 'Read')
                                                    : t('notification.unread_status', 'Unread')
                                                }
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Calendar size={12} className="text-gray-400" />
                                                    {formatDate(notification.created_at)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {formatDateTime(notification.created_at)}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                {!notification.read_at && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                        className="btn btn-xs btn-success btn-outline"
                                                        title={t('notification.mark_as_read', 'Mark as read')}
                                                    >
                                                        <CheckCircle size={12} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(notification.id)}
                                                    className="btn btn-xs btn-error btn-outline"
                                                    title={t('notification.delete', 'Delete')}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-16 flex flex-col justify-center items-center gap-3">
                        <Bell size={40} className="text-gray-400" />
                        <h1 className="text-gray-500 text-lg font-medium">
                            {t('notification.no_notifications', 'No notifications found!')}
                        </h1>
                        <p className="text-gray-400 text-sm">
                            {searchForm.data.search || searchForm.data.type || searchForm.data.read_status || searchForm.data.start_date
                                ? t('notification.try_different_filters', 'Try different search or filter criteria')
                                : t('notification.all_caught_up', 'You\'re all caught up! No notifications at the moment.')
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}