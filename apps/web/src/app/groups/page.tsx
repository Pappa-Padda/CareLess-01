'use client';
import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import GroupIcon from '@mui/icons-material/Group';
import AddIcon from '@mui/icons-material/Add';
import LoginIcon from '@mui/icons-material/Login';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PageContainer from '@/components/shared/ui/PageContainer';
import PageHeading from '@/components/shared/ui/PageHeading';
import CustomDialog from '@/components/shared/ui/CustomDialog';
import CustomTextField from '@/components/shared/ui/CustomTextField';
import SubmitButton from '@/components/shared/ui/SubmitButton';
import CancelButton from '@/components/shared/ui/CancelButton';
import CustomTable, { Column } from '@/components/shared/ui/CustomTable';
import ErrorMessage from '@/components/shared/ui/ErrorMessage';

interface Group {
  id: number;
  name: string;
  description: string | null;
  profilePicture: string | null;
}

export default function GroupDashboard() {
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [joinOpen, setJoinOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [fileName, setFileName] = React.useState<string>('');
  const [joinError, setJoinError] = React.useState<string | null>(null);
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof Group | 'actions'; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc',
  });

  const fetchGroups = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups?page=${pageNum}&limit=20`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups);
        setTotal(data.total);
        setPage(data.page);
      }
    } catch (error) {
      console.error('Failed to fetch groups', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchGroups();
  }, []);

  const handleSort = (columnId: keyof Group | 'actions') => {
    const isAsc = sortConfig.key === columnId && sortConfig.direction === 'asc';
    setSortConfig({ key: columnId, direction: isAsc ? 'desc' : 'asc' });
  };

  const sortedGroups = React.useMemo(() => {
    if (sortConfig.key === 'actions') return groups;
    
    return [...groups].sort((a, b) => {
      const valA = a[sortConfig.key as keyof Group];
      const valB = b[sortConfig.key as keyof Group];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (valA < valB) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [groups, sortConfig]);

  const handleNextPage = () => {
    if ((page * 20) < total) {
      fetchGroups(page + 1);
    }
  };

  const handleCreateGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (res.ok) {
        setCreateOpen(false);
        setFileName('');
        fetchGroups(1); // Refresh list
      } else {
        alert('Failed to create group');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setJoinError(null);
    const formData = new FormData(event.currentTarget);
    const groupId = formData.get('groupId') as string;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ groupId }),
      });
      if (res.ok) {
        setJoinOpen(false);
        fetchGroups(1); // Refresh list
      } else {
        const data = await res.json();
        setJoinError(data.error || 'Failed to join group');
      }
    } catch (error) {
      console.error(error);
      setJoinError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveGroup = async (groupId: number) => {
    if (!confirm('Are you sure you want to leave this group?')) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ groupId }),
      });

      if (res.ok) {
        fetchGroups(1);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to leave group');
      }
    } catch (error) {
      console.error('Failed to leave group', error);
    }
  };
  
  const columns: Column<Group>[] = [
    { id: 'profilePicture', label: '', width: 50 },
    { id: 'name', label: 'Group Name', sortable: true },
    { id: 'description', label: 'Description', sortable: true },
    { id: 'actions', label: 'Actions', align: 'right', width: 100 },
  ];

  const renderCell = (group: Group, column: Column<Group>) => {
    switch (column.id) {
      case 'profilePicture':
        return <Avatar src={group.profilePicture || undefined}><GroupIcon /></Avatar>;
      case 'name':
        return <Typography sx={{ fontWeight: 'medium' }}>{group.name}</Typography>;
      case 'description':
        return group.description && group.description.length > 50
          ? `${group.description.substring(0, 50)}...`
          : group.description;
      case 'id':
        return <Typography variant="caption" color="text.secondary">#{group.id}</Typography>;
      case 'actions':
        return (
          <IconButton
            color="error"
            size="small"
            onClick={() => handleLeaveGroup(group.id)}
            title="Leave Group"
          >
            <ExitToAppIcon fontSize="small" />
          </IconButton>
        );
      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageHeading>Groups</PageHeading>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<LoginIcon />} onClick={() => setJoinOpen(true)}>
            Join Group
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Create Group
          </Button>
        </Box>
      </Box>

      <CustomTable
        columns={columns}
        data={sortedGroups}
        isLoading={loading}
        renderCell={renderCell}
        emptyMessage="You are not a member of any groups yet."
        sortConfig={sortConfig}
        onSort={handleSort}
      />

      {(page * 20) < total && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button onClick={handleNextPage} disabled={loading}>
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </Box>
      )}

      {/* Create Group Modal */}
      <CustomDialog
        open={createOpen}
        onClose={() => { setCreateOpen(false); setFileName(''); }}
        title="Create New Group"
        component="form"
        onSubmit={handleCreateGroup}
        maxWidth="sm"
        fullWidth
        actions={
          <>
            <CancelButton onClick={() => { setCreateOpen(false); setFileName(''); }}>Cancel</CancelButton>
            <SubmitButton isSubmitting={isSubmitting} submittingText="Creating...">
              Create
            </SubmitButton>
          </>
        }
      >
        <CustomTextField
          autoFocus
          id="name"
          name="name"
          label="Group Name"
          placeholder="e.g. My Church"
          required
        />
        <CustomTextField
          id="description"
          name="description"
          label="Description"
          placeholder="Briefly describe the group"
          multiline
          rows={3}
        />
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
          >
            Upload Picture
            <input
              type="file"
              name="profilePicture"
              hidden
              accept="image/*"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
            />
          </Button>
          {fileName && <Typography variant="caption">{fileName}</Typography>}
        </Box>
      </CustomDialog>

      {/* Join Group Modal */}
      <CustomDialog
        open={joinOpen}
        onClose={() => { setJoinOpen(false); setJoinError(null); }}
        title="Join Existing Group"
        component="form"
        onSubmit={handleJoinGroup}
        maxWidth="xs"
        fullWidth
        actions={
          <>
            <CancelButton onClick={() => { setJoinOpen(false); setJoinError(null); }}>Cancel</CancelButton>
            <SubmitButton isSubmitting={isSubmitting} submittingText="Joining...">
              Join
            </SubmitButton>
          </>
        }
      >
        <Typography variant="body2" color="text.secondary">
          Enter the Group ID to join a community.
        </Typography>
        <ErrorMessage message={joinError} />
        <CustomTextField
          autoFocus
          id="groupId"
          name="groupId"
          label="Group ID"
          placeholder="123"
          type="number"
          required
        />
      </CustomDialog>
    </PageContainer>
  );
}
