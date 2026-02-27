'use client';

import { useState, useRef, useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Search, Home, Star, MessageSquare, FileText, Calendar, Clock, Users, MoreHorizontal, Plus, Send, Smile, Paperclip, ChevronRight, ArrowRight, Coffee, Zap, Database, CloudUpload, BarChart, Settings, LogOut, Moon, Sun, User, Bell, HelpCircle, Gift } from 'lucide-react';
import { ResizableCard } from '@/components/ui/ResizableCard';
import { SplitPane } from '@/components/ui/SplitPane';

// 模拟数据
const mockConversations = [
  {
    id: 1,
    name: '产品需求讨论',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=business%20team%20avatar&image_size=square',
    type: 'group',
    lastMessage: '明天上午10点讨论新功能',
    time: '14:15',
    unread: 3,
  },
  {
    id: 2,
    name: '张三',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20man%20avatar&image_size=square',
    type: 'single',
    lastMessage: '好的，我知道了',
    time: '13:45',
    unread: 0,
  },
  {
    id: 3,
    name: '李四',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20woman%20avatar&image_size=square',
    type: 'single',
    lastMessage: '文件已经发送',
    time: '10:30',
    unread: 1,
  },
  {
    id: 4,
    name: '技术团队',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tech%20team%20avatar&image_size=square',
    type: 'group',
    lastMessage: '代码审核已完成',
    time: '昨天',
    unread: 0,
  },
  {
    id: 5,
    name: '市场部',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=marketing%20team%20avatar&image_size=square',
    type: 'group',
    lastMessage: '下周活动计划已更新',
    time: '昨天',
    unread: 2,
  },
];

const mockMessages = [
  {
    id: 1,
    sender: '张三',
    content: '你好，关于明天的会议，我们需要准备什么材料？',
    time: '14:10',
    type: 'received',
  },
  {
    id: 2,
    sender: '我',
    content: '主要是新功能的需求文档和技术方案',
    time: '14:12',
    type: 'sent',
  },
  {
    id: 3,
    sender: '张三',
    content: '好的，我已经准备好了',
    time: '14:15',
    type: 'received',
  },
  {
    id: 4,
    sender: '张三',
    content: '我们还需要讨论一下项目时间线',
    time: '14:16',
    type: 'received',
  },
];

const mockTasks = [
  {
    id: 1,
    title: '完成需求文档',
    status: 'pending',
    assignee: '张三',
    dueDate: '2026-03-01',
  },
  {
    id: 2,
    title: '代码审核',
    status: 'in_progress',
    assignee: '李四',
    dueDate: '2026-02-28',
  },
  {
    id: 3,
    title: '测试新功能',
    status: 'pending',
    assignee: '王五',
    dueDate: '2026-03-02',
  },
];

export default function FeishuLayout() {
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [messages, setMessages] = useState(mockMessages);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1200);
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages([...messages, {
        id: messages.length + 1,
        sender: '我',
        content: inputValue,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        type: 'sent',
      }]);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = mockConversations.filter(conv => 
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SidebarProvider>
      <div className={`flex h-screen overflow-hidden ${
        darkMode ? 'dark bg-gray-950' : 'bg-gray-50'
      }`}>
        <SplitPane
        orientation="vertical"
        defaultSize={256}
        minSize={200}
        maxSize={320}
        storageKey="left-sidebar-size"
      >
        {/* 左栏 - 导航区 */}
        <div className="border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
          {/* 顶部 Logo */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 dark:text-white">飞书</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Feishu</p>
              </div>
            </div>
          </div>

          {/* 搜索框 */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                placeholder="搜索... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="pl-10 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 border-0 rounded-lg"
              />
            </div>
          </div>

          {/* 导航菜单 */}
          <div className="flex-1">
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton className="gap-3 px-4 py-2.5 h-auto hover:bg-gray-100 dark:hover:bg-gray-800/50">
                  <Home className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium text-sm">消息</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="gap-3 px-4 py-2.5 h-auto hover:bg-gray-100 dark:hover:bg-gray-800/50">
                  <Star className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium text-sm">收藏</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="gap-3 px-4 py-2.5 h-auto hover:bg-gray-100 dark:hover:bg-gray-800/50">
                  <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium text-sm">云文档</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="gap-3 px-4 py-2.5 h-auto hover:bg-gray-100 dark:hover:bg-gray-800/50">
                  <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium text-sm">日历</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="gap-3 px-4 py-2.5 h-auto hover:bg-gray-100 dark:hover:bg-gray-800/50">
                  <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium text-sm">待办</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="gap-3 px-4 py-2.5 h-auto hover:bg-gray-100 dark:hover:bg-gray-800/50">
                  <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium text-sm">通讯录</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>

          {/* 底部菜单 */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 h-9 bg-gray-100 dark:bg-gray-800 border-0"
            >
              <Plus className="h-4 w-4" />
              <span>新建</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 h-9 bg-gray-100 dark:bg-gray-800 border-0"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span>{darkMode ? '浅色模式' : '深色模式'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 h-9 bg-gray-100 dark:bg-gray-800 border-0"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span>更多</span>
            </Button>
          </div>
        </div>
        <SplitPane
          orientation="vertical"
          defaultSize={512}
          minSize={300}
          maxSize={800}
          storageKey="middle-pane-size"
        >
          {/* 中栏 - 列表区 */}
          <div className="border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
            {/* 顶部搜索和操作 */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex-1">
                <Input
                  placeholder="搜索聊天..."
                  className="text-sm bg-gray-100 dark:bg-gray-800 border-0"
                />
              </div>
              <Button variant="ghost" size="icon" className="ml-2">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* 会话列表 */}
            <ScrollArea className="flex-1">
              <div className="space-y-1 p-2">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/50 ${
                      selectedConversation.id === conv.id
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : ''
                    }`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={conv.avatar}
                            alt={conv.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {conv.name}
                            </h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                              {conv.time}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {conv.lastMessage}
                          </p>
                        </div>
                      </div>
                      {conv.unread > 0 && (
                        <Badge className="bg-blue-500 text-white ml-2 flex-shrink-0">
                          {conv.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          {/* 右栏 - 详情/聊天区 */}
          <div className="bg-white dark:bg-gray-900 flex flex-col">
            {/* 顶部通知卡片 */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <ResizableCard
                defaultWidth={500}
                defaultHeight={120}
                minWidth={300}
                minHeight={100}
                maxWidth={800}
                maxHeight={200}
                storageKey="notification-card-size"
              >
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        【卡片活动】
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        参与新功能体验，赢取精美礼品！
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                    >
                      立即参与
                    </Button>
                  </div>
                </div>
              </ResizableCard>
            </div>

            {/* 聊天记录区域 */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6" ref={messagesEndRef}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        msg.type === 'sent'
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-gray-900 dark:text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200'
                      }`}
                    >
                      <p className="text-sm mb-1">{msg.content}</p>
                      <span className="text-xs text-gray-500 dark:text-gray-400 float-right">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* 底部输入框 */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Smile className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Textarea
                  placeholder="输入消息..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 resize-none min-h-[40px] max-h-[120px] text-sm"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="h-10 w-10 rounded-full bg-blue-500 text-white hover:bg-blue-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </SplitPane>
      </SplitPane>
    </div>
    </SidebarProvider>
  );
}
