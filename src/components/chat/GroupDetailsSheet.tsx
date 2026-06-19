'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X, Users, UserPlus, Copy, Check,
  LogOut, Edit2, RefreshCw, Loader2, Camera,
  MoreVertical, UserMinus, Crown, Trash2, Search
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { groupApi, GroupConversation, GroupMember } from '@/lib/groupApi';
import { UploadService } from '@/lib/uploadService';
import { profileApi } from '@/lib/backendApi';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type AnyConversation = GroupConversation | Record<string, unknown>;

function convId(c: AnyConversation): string {
  return String((c as GroupConversation).id || '');
}

interface GroupDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: AnyConversation;
  currentUserId: string;
}

type MemberMenuTarget = { userId: string; isAdmin: boolean; x: number; y: number } | null;

export function GroupDetailsSheet({ isOpen, onClose, conversation, currentUserId }: GroupDetailsSheetProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [groupDetails, setGroupDetails] = useState<GroupConversation | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [memberMenu, setMemberMenu] = useState<MemberMenuTarget>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [addResults, setAddResults] = useState<Array<{ id: string; username?: string; full_name?: string; avatar_url?: string }>>([]);
  const [addSelected, setAddSelected] = useState<Set<string>>(new Set());
  const [addSearching, setAddSearching] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const addSearchRef = useRef<HTMLInputElement>(null);

  const group = groupDetails || (conversation as GroupConversation);
  const isAdmin = group?.created_by === currentUserId;
  const id = convId(conversation);

  useEffect(() => {
    if (isOpen && id) {
      fetchData();
    }
  }, [isOpen, id]);

  const fetchData = async () => {
    if (!id) return;
    setLoadingMembers(true);
    try {
      const [details, memberList] = await Promise.all([
        groupApi.getGroupInfo(id).catch(() => null),
        groupApi.listMembers(id),
      ]);
      setGroupDetails(details);
      setMembers(memberList);
    } catch {
      toast.error('خطا در بارگذاری اطلاعات گروه');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCopyInvite = () => {
    if (!group?.invite_code) return;
    const link = `${window.location.origin}/group/${encodeURIComponent(group.invite_code)}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('لینک دعوت کپی شد');
    });
  };

  const handleRegenerateInvite = async () => {
    if (!group?.invite_code) return;
    setRegenerating(true);
    try {
      await groupApi.updateInvite(id, {
        invite_code: crypto.randomUUID().replace(/-/g, '').slice(0, 16),
        invite_enabled: true,
      });
      await fetchData();
      toast.success('لینک دعوت تغییر یافت');
    } catch {
      toast.error('خطا در بروزرسانی لینک');
    } finally {
      setRegenerating(false);
    }
  };

  const startEditing = () => {
    setEditName(group?.name || '');
    setEditImagePreview(group?.image || null);
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    setSavingEdit(true);
    try {
      let imageUrl = group?.image;
      if (editImageFile && user?.id) {
        imageUrl = await UploadService.uploadAvatar(editImageFile, user.id);
      }
      await groupApi.updateGroupInfo(id, {
        name: editName.trim(),
        image_url: imageUrl ?? undefined,
      });
      await fetchData();
      setEditing(false);
      toast.success('اطلاعات گروه بروزرسانی شد');
    } catch {
      toast.error('خطا در بروزرسانی');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setMemberMenu(null);
    try {
      await groupApi.removeMember(id, userId);
      setMembers(prev => prev.filter(m => m.user_id !== userId));
      toast.success('عضو حذف شد');
    } catch {
      toast.error('خطا در حذف عضو');
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('آیا از خروج از این گروه اطمینان دارید؟')) return;
    try {
      await groupApi.leaveGroup(id);
      toast.success('از گروه خارج شدید');
      onClose();
      router.push('/messages');
    } catch {
      toast.error('خطا در خروج از گروه');
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('آیا از حذف این گروه اطمینان دارید؟')) return;
    try {
      await groupApi.deleteGroup(id);
      toast.success('گروه حذف شد');
      onClose();
      router.push('/messages');
    } catch {
      toast.error('خطا در حذف گروه');
    }
  };

  useEffect(() => {
    if (!showAddMember) { setAddSearch(''); setAddResults([]); setAddSelected(new Set()); return; }
    setTimeout(() => addSearchRef.current?.focus(), 80);
  }, [showAddMember]);

  useEffect(() => {
    if (!addSearch.trim()) { setAddResults([]); return; }
    const timer = setTimeout(async () => {
      setAddSearching(true);
      try {
        const res = await profileApi.search(addSearch, 20);
        const memberIds = new Set(members.map(m => m.user_id));
        setAddResults((res || []).filter((u: { id: string }) => !memberIds.has(u.id)));
      } catch { setAddResults([]); }
      finally { setAddSearching(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [addSearch, members]);

  const handleAddMembers = async () => {
    if (addSelected.size === 0) return;
    setAddingMembers(true);
    try {
      await groupApi.addMembers(id, Array.from(addSelected));
      await fetchData();
      toast.success(`${addSelected.size} عضو اضافه شد`);
      setShowAddMember(false);
    } catch {
      toast.error('خطا در افزودن عضو');
    } finally {
      setAddingMembers(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />

      {showAddMember && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddMember(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md flex flex-col max-h-[75vh] animate-slide-in-bottom sm:animate-none z-10">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-lg">افزودن عضو به گروه</h3>
              <button onClick={() => setShowAddMember(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  ref={addSearchRef}
                  value={addSearch}
                  onChange={e => setAddSearch(e.target.value)}
                  placeholder="جستجوی کاربران..."
                  className="w-full h-10 pr-9 pl-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm outline-none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {addSearching ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-vista-primary" /></div>
              ) : addResults.length === 0 && addSearch.trim() ? (
                <p className="text-center py-6 text-sm text-zinc-400">کاربری یافت نشد</p>
              ) : addResults.length === 0 ? (
                <p className="text-center py-6 text-sm text-zinc-400">نام یا نام کاربری را تایپ کنید</p>
              ) : (
                addResults.map(u => (
                  <button
                    key={u.id}
                    onClick={() => setAddSelected(prev => {
                      const next = new Set(prev);
                      next.has(u.id) ? next.delete(u.id) : next.add(u.id);
                      return next;
                    })}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                  >
                    <div className="relative shrink-0">
                      <Avatar src={u.avatar_url} alt={u.full_name || u.username || ''} size="sm" />
                      {addSelected.has(u.id) && (
                        <div className="absolute inset-0 rounded-full bg-vista-primary/90 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="text-right min-w-0">
                      <p className="text-sm font-medium truncate">{u.full_name || u.username}</p>
                      {u.full_name && <p className="text-xs text-zinc-400 truncate">@{u.username}</p>}
                    </div>
                  </button>
                ))
              )}
            </div>
            {addSelected.size > 0 && (
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={handleAddMembers}
                  disabled={addingMembers}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-vista-gradient text-white font-semibold text-sm disabled:opacity-60"
                >
                  {addingMembers ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  افزودن {addSelected.size} نفر
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {memberMenu && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setMemberMenu(null)} />
          <div
            className="fixed z-[70] bg-vista-surface dark:bg-vista-surface-dark border border-vista-border dark:border-vista-border-dark rounded-2xl shadow-2xl overflow-hidden min-w-[180px]"
            style={{ top: memberMenu.y, left: memberMenu.x }}
          >
            <button
              onClick={() => handleRemoveMember(memberMenu.userId)}
              className="flex items-center gap-3 w-full px-4 py-3 text-vista-error hover:bg-vista-error/10 transition-colors text-sm"
            >
              <UserMinus className="w-4 h-4" />
              {'حذف از گروه'}
            </button>
          </div>
        </>
      )}

      <div className={cn(
        'fixed top-0 left-0 h-full w-full md:w-[400px] z-50 shadow-2xl flex flex-col',
        'bg-vista-bg dark:bg-vista-bg-dark',
        'transform transition-transform duration-300',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-vista-border dark:border-vista-border-dark">
          <h2 className="text-lg font-bold">{'اطلاعات گروه'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col items-center gap-3 border-b border-vista-border dark:border-vista-border-dark">
            <div className="relative">
              <Avatar src={editImagePreview || group?.image} alt={group?.name || 'گروه'} size="xl" />
              {editing && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-vista-primary text-white flex items-center justify-center shadow-lg"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) { setEditImageFile(f); setEditImagePreview(URL.createObjectURL(f)); }
              }}
            />

            {editing ? (
              <div className="flex items-center gap-2 w-full max-w-xs">
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="flex-1 bg-vista-surface-variant dark:bg-vista-surface-variant-dark rounded-xl px-3 py-2 text-center font-bold focus:outline-none focus:ring-2 focus:ring-vista-primary"
                  maxLength={50}
                  autoFocus
                />
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit || !editName.trim()}
                  className="p-2 rounded-xl bg-vista-primary text-white disabled:opacity-50"
                >
                  {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button onClick={() => setEditing(false)} className="p-2 rounded-xl hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{group?.name || 'گروه'}</h3>
                {isAdmin && (
                  <button onClick={startEditing} className="p-1 rounded-lg hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark transition-colors">
                    <Edit2 className="w-4 h-4 text-vista-text-secondary dark:text-vista-text-secondary-dark" />
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-1.5 text-vista-text-secondary dark:text-vista-text-secondary-dark text-sm">
              <Users className="w-4 h-4" />
              <span>{members.length || group?.member_count || 0} {'عضو'}{group?.max_members ? ` از ${group.max_members}` : ''}</span>
            </div>
          </div>

          {group?.invite_code && (
            <div className="p-4 border-b border-vista-border dark:border-vista-border-dark">
              <p className="text-sm font-semibold text-vista-text-secondary dark:text-vista-text-secondary-dark mb-2">{'لینک دعوت'}</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-vista-surface-variant dark:bg-vista-surface-variant-dark rounded-xl px-3 py-2 text-xs font-mono truncate text-vista-text-secondary dark:text-vista-text-secondary-dark">
                  {`${typeof window !== 'undefined' ? window.location.origin : ''}/group/${group.invite_code}`}
                </div>
                <button
                  onClick={handleCopyInvite}
                  className="p-2 rounded-xl bg-vista-primary/10 text-vista-primary hover:bg-vista-primary/20 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                {isAdmin && (
                  <button
                    onClick={handleRegenerateInvite}
                    disabled={regenerating}
                    className="p-2 rounded-xl bg-vista-surface-variant dark:bg-vista-surface-variant-dark hover:bg-vista-primary/10 transition-colors disabled:opacity-50"
                  >
                    {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="p-4 border-b border-vista-border dark:border-vista-border-dark">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold">{'اعضا'}</p>
              {isAdmin && (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-1 text-vista-primary text-sm font-medium hover:text-vista-secondary transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  {'افزودن'}
                </button>
              )}
            </div>

            {loadingMembers ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-vista-primary" />
              </div>
            ) : (
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {members.map(member => (
                  <div key={member.user_id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark transition-colors">
                    <Avatar src={member.avatar_url} alt={member.full_name || member.username || 'کاربر'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.user_id === currentUserId ? 'شما' : (member.full_name || member.username || 'کاربر')}
                      </p>
                      {member.is_admin && (
                        <div className="flex items-center gap-1">
                          <Crown className="w-3 h-3 text-yellow-500" />
                          <span className="text-[11px] text-yellow-600 dark:text-yellow-400 font-medium">{'مدیر'}</span>
                        </div>
                      )}
                    </div>
                    {isAdmin && member.user_id !== currentUserId && (
                      <button
                        onClick={e => {
                          const rect = (e.target as Element).getBoundingClientRect();
                          setMemberMenu({ userId: member.user_id, isAdmin: member.is_admin, x: rect.left - 180, y: rect.bottom + 4 });
                        }}
                        className="p-1 rounded-lg hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark"
                      >
                        <MoreVertical className="w-4 h-4 text-vista-text-secondary dark:text-vista-text-secondary-dark" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 space-y-1 mb-8">
            <button
              onClick={handleLeaveGroup}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-vista-error hover:bg-vista-error/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>{'خروج از گروه'}</span>
            </button>
            {isAdmin && (
              <button
                onClick={handleDeleteGroup}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-vista-error hover:bg-vista-error/10 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span>{'حذف گروه'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
