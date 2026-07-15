import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  List,
  ListItem,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FolderZipIcon from '@mui/icons-material/FolderZip';

import Layout from '../components/Layout';
import butterFlyLogo from '../../../assets/mascot-butterfly.png';
import fishLogo from '../../../assets/mascot-fish.png';
import flowerLogo from '../../../assets/mascot-flower.png';
import frogLogo from '../../../assets/mascot-frog.png';
import mreevesiLogo from '../../../assets/mascot-Mreevesi.png';

import { useI18n } from '../contexts/i18n';
import { useProject } from '../contexts/project';

type IntroItem = {
  id: string | number;
  title: string;
  desc: string;
  img_key: string;
};

type ProjectItem = {
  id: string | number;
  name: string;
  updated_at: string;
};

const imgMap: Record<string, string> = {
  butterfly: butterFlyLogo,
  fish: fishLogo,
  flower: flowerLogo,
  frog: frogLogo,
  mreevesi: mreevesiLogo,
};

const introSectionKeyByImgKey = {
  flower: 'project',
  frog: 'template',
  mreevesi: 'edit',
  fish: 'validate',
  butterfly: 'clearance',
} as const;

const ProjectPage = ({}) => {
  const navigate = useNavigate();
  const { selectedProject, setSelectedProject } = useProject();
  const { messages } = useI18n();
  const [selectedAction, setSelectedAction] = useState<'new' | 'open' | null>(
    'new',
  );
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [intro, setIntro] = useState<IntroItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectName, setProjectName] = useState<string>('');

  const getButtonStyle = (isSelected: boolean) => {
    return isSelected
      ? {
          bgcolor: 'secondary.main',
          color: 'common.white',
          boxShadow: 'none',
        }
      : {
          borderColor: 'primary.main',
          color: 'primary.main',
          '&:hover': {
            bgcolor: '#e8eaf6',
          },
        };
  };

  const handleDialog = () => {
    setOpenDialog(true);
  };

  const createProject = async (name: string) => {
    if (!name.trim()) {
      alert(messages.projectPage.alerts.enterProjectName); // 請輸入專案名稱
      return;
    }

    try {
      await window.electron.ipcRenderer.invoke('create-project', {
        name,
      });

      const latestId = await window.electron.ipcRenderer.invoke(
        'get-latest-project-id',
      );

      if (latestId) {
        setSelectedProject(latestId);
      } else {
        alert(messages.projectPage.alerts.createProjectMissingLatestId); // 建立專案時發生錯誤。找不到最新專案 ID
      }

      setProjectName('');
      navigate('/data-template');
    } catch (error) {
      console.error('建立失敗:', error);
      alert(messages.projectPage.alerts.createProjectFailed); // 建立專案時發生錯誤
    }
  };

  const OpenProject = async () => {
    if (!selectedProject) {
      alert(messages.projectPage.alerts.selectProjectFirst); // 請先選擇專案
      return;
    }

    try {
      await window.electron.ipcRenderer.invoke(
        'touch-project-updated-at',
        selectedProject,
      );
    } catch (error) {
      console.warn('更新專案時間失敗:', error);
    }

    navigate('/data-edit');
  };

  const deleteProject = async (id: number) => {
    if (!id) {
      alert(messages.projectPage.alerts.selectProjectFirst); // 請先選擇專案
      return;
    }

    try {
      await window.electron.ipcRenderer.invoke('delete-project', id);
      setSelectedProject(null); // 清除選取
      setOpenDialog(false); // 關閉 dialog
      fetchPeojects(); // 獲取新的專案列表
    } catch (error) {
      alert(messages.projectPage.alerts.deleteProjectFailed); // 刪除專案時發生錯誤
    }
  };

  const fetchPeojects = async () => {
    try {
      window.electron.ipcRenderer.invoke('get-projects').then((result) => {
        console.log('projects data:', result);
        setProjects(result);
      });
    } catch (error) {
      alert(messages.projectPage.alerts.fetchProjectsFailed); // 獲取專案列表時發生錯誤
    }
  };

  useEffect(() => {
    window.electron.ipcRenderer.invoke('get-intro').then((result) => {
      setIntro(result);
    });

    window.electron.ipcRenderer.invoke('get-projects').then((result) => {
      setProjects(result);
    });
  }, []);

  return (
    <Layout>
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'stretch',
          height: 0,
        }}
      >
        {/* 左側欄 */}
        <Box
          sx={{
            flex: 1,
            borderRight: 1,
            borderColor: 'primary.main',
            px: 1,
            py: 2,
            overflow: 'auto',
          }}
        >
          <Stack direction="column" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setSelectedAction('new')}
              sx={getButtonStyle(selectedAction === 'new')}
            >
              {messages.projectPage.actions.createNewProject}
              {/* 原始中文：建立新專案 */}
            </Button>

            <Button
              variant="outlined"
              startIcon={<FolderOpenIcon />}
              onClick={() => setSelectedAction('open')}
              sx={getButtonStyle(selectedAction === 'open')}
            >
              {messages.projectPage.actions.openExistingProject}
              {/* 原始中文：開啟舊專案 */}
            </Button>
          </Stack>
        </Box>

        {/* 中間表單區 */}
        {selectedAction === 'new' && (
          <Box
            sx={{
              flex: 2,
              display: 'flex',
              flexDirection: 'column',
              borderRight: 1,
              borderColor: 'primary.main',
              px: 2,
              py: 2,
              overflow: 'auto',
            }}
          >
            <Box
              component="form"
              noValidate
              autoComplete="off"
              sx={{ flex: 1 }}
            >
              <Typography
                variant="h6"
                sx={{ color: 'text.primary', marginBottom: 1 }}
              >
                {messages.projectPage.form.createTitle}
                {/* 原始中文：建立新專案 */}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', marginBottom: 2 }}
              >
                {messages.projectPage.form.createDescription}{' '}
                {/* 請填寫以下欄位以建立新專案，標註 */}
                <span style={{ color: 'red' }}>*</span>{' '}
                {messages.projectPage.form.requiredMark}
                {/* 為必填。 */}
              </Typography>
              <TextField
                id="project-name"
                label={messages.projectPage.form.projectNameLabel} // 專案名稱
                variant="outlined"
                fullWidth
                InputLabelProps={{
                  sx: {
                    color: 'text.secondary',
                  },
                }}
                size="small"
                onChange={(event) => setProjectName(event.target.value)}
              />
            </Box>
            <Button
              variant="outlined"
              fullWidth
              sx={{
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: '#e8eaf6',
                },
              }}
              onClick={() => createProject(projectName)}
            >
              {messages.projectPage.form.createButton}
              {/* 建立專案 */}
            </Button>
          </Box>
        )}

        {selectedAction === 'open' && (
          <Box
            sx={{
              flex: 2,
              display: 'flex',
              flexDirection: 'column',
              borderRight: 1,
              borderColor: 'primary.main',
              px: 2,
              py: 2,
              height: '100%',
            }}
          >
            {/* 上方：可捲動內容 */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ mb: 1 }}>
                {messages.projectPage.projectList.title}
                {/* 我的資料專案 */}
              </Typography>

              <Typography
                variant="body2"
                sx={{ mb: 2, color: 'text.secondary' }}
              >
                {messages.projectPage.projectList.description}
                {/* 以下是您過往建立或匯入的專案，您可以繼續編輯或檢視進度。 */}
              </Typography>

              <List disablePadding>
                {projects
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.updated_at).getTime() -
                      new Date(a.updated_at).getTime(),
                  )
                  .map((item) => (
                    <Box key={item.id} sx={{ mb: 1 }}>
                      <ListItem
                        onClick={() => setSelectedProject(Number(item.id))}
                        sx={{
                          bgcolor: '#e8eaf6',
                          borderRadius: 2,
                          px: 2,
                          py: 1,
                          border:
                            selectedProject === item.id
                              ? '2px solid #3f51b5'
                              : '2px solid transparent',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: '#dfe3f5',
                            cursor: 'pointer',
                          },
                        }}
                      >
                        <FolderZipIcon sx={{ color: 'primary.main', mr: 2 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2">
                            {item.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {messages.projectPage.projectList.lastUpdatedPrefix}
                            {/* 原始中文：最後更新日期： */}
                            {item.updated_at}
                          </Typography>
                        </Box>
                      </ListItem>
                    </Box>
                  ))}
              </List>
            </Box>

            {/* 永遠貼底的按鈕 */}
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                fullWidth
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': { bgcolor: '#e8eaf6' },
                }}
                onClick={OpenProject}
              >
                {messages.projectPage.projectList.openButton}
                {/* 開啟專案 */}
              </Button>

              <Button
                variant="outlined"
                fullWidth
                sx={{
                  borderColor: 'error.dark',
                  color: 'error.dark',
                  '&:hover': { bgcolor: 'error.light' },
                }}
                onClick={handleDialog}
              >
                {messages.projectPage.projectList.deleteButton}
                {/* 刪除專案 */}
              </Button>
            </Stack>
          </Box>
        )}

        {/* 右側說明區 */}
        <Box sx={{ flex: 2, px: 3, py: 2, overflow: 'auto' }}>
          <Typography color="text.primary" sx={{ marginBottom: 3 }}>
            {messages.projectPage.about.introPrefix}
            {/* TaiBIF Open Data Toolkit 是一個專門針對生物多樣性資料整合的強大工具，採用了國際生物多樣性領域常用的 */}
            <Link
              href="https://dwc.tdwg.org/"
              target="_blank"
              rel="noopener"
              underline="hover"
              sx={{ mx: 0.5 }}
            >
              Darwin Core
            </Link>
            {messages.projectPage.about.introSuffix}
            {/* 資料標準，旨在幫助使用者建立並有效管理、編輯、驗證和清理生物多樣性資料集。若想要建立資料模板、資料編輯管理和發布，此工具將能引導您進入理想的資料管理流程，並協助管控資料品質。 */}
          </Typography>
          {intro.map((item) => {
            const sectionKey = introSectionKeyByImgKey[
              item.img_key as keyof typeof introSectionKeyByImgKey
            ];
            const section =
              sectionKey && messages.projectPage.introSections[sectionKey];

            return (
              <Box
                key={item.id}
                id={`intro-${item.id}`}
                className="intro"
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: 3,
                }}
              >
                <Box
                  component="img"
                  alt={item.title}
                  src={imgMap[item.img_key]}
                  sx={{ width: 40, height: 40, marginRight: 2 }}
                  className="nav-img"
                ></Box>
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                    data-i18n={item.id}
                  >
                    {/* 專案管理 / 資料模板 / 資料編輯 / 資料驗證 / 資料清理 */}
                    {section?.title ?? item.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    data-i18n={`intro-${item.id}`}
                  >
                    {/* 各段介紹文字由 get-intro 對應內容提供 */}
                    {section?.desc ?? item.desc}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        <Dialog
          open={openDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {messages.projectPage.deleteDialog.title}
            {/* 確定要刪除此專案嗎？ */}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description" variant="body2">
              {messages.projectPage.deleteDialog.description}
              {/* 專案內容刪除後將無法恢復，所有資料將永久移除。請確認是否繼續進行刪除操作。 */}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setOpenDialog(false);
              }}
            >
              {messages.projectPage.deleteDialog.cancel}
              {/* 取消 */}
            </Button>
            <Button
              onClick={() => {
                if (selectedProject !== null) {
                  deleteProject(selectedProject);
                }
              }}
            >
              {messages.projectPage.deleteDialog.confirm}
              {/* 確認刪除 */}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default ProjectPage;
