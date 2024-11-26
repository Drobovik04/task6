using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Text.Json;
using System.Text.RegularExpressions;
using task6.Models;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace task6.Hub
{
    public class PresentationState
    {
        public List<Presentation> Presentations { get; set; } = new List<Presentation>();

        public Dictionary<string, string> UserToPresentationMap { get; set; } = new Dictionary<string, string>();

        public List<User> Users { get; set; } = new List<User>();
        public Dictionary<string, bool> AdminEnterAfterCreate { get; set; } = new Dictionary<string, bool>();
    }

    public class PresentationHub: Microsoft.AspNetCore.SignalR.Hub
    {
        public readonly PresentationState _state;
        private readonly IHubContext<PresentationHub> _hubContext;

        public PresentationHub(PresentationState state, IHubContext<PresentationHub> hubContext)
        {
            _state = state;
            _hubContext = hubContext;
        }
        //public PresentationHub() 
        //{
        //    Presentations.AddRange(new List<Presentation>() 
        //    {
        //        new Presentation()
        //        {
        //            Id = Guid.NewGuid().ToString(), Name = "adssa",
        //            Users = new List<User>
        //            {
        //                new User() { Nickname = "asdsa"}
        //            },
        //            Slides = new List<Slide>()
        //            {
        //                new Slide()
        //                {
        //                    Id = Guid.NewGuid().ToString(), Elements = new List<Element>()
        //                    {
        //                        new Text() {Content = "adasdsa", Position = new Position() {X = 5, Y = 10 } }
        //                    }
        //                },
        //                new Slide()
        //                {
        //                    Id = Guid.NewGuid().ToString(), Elements = new List<Element>()
        //                    {
        //                        new Text() {Content = "adasdsa", Position = new Position() {X = 5, Y = 10 } }
        //                    }
        //                },
        //                new Slide()
        //                {
        //                    Id = Guid.NewGuid().ToString(), Elements = new List<Element>()
        //                    {
        //                        new Text() {Content = "adasdsa", Position = new Position() {X = 5, Y = 10 } }
        //                    }
        //                },
        //            }
        //        },
        //        new Presentation()
        //        {
        //            Id = Guid.NewGuid().ToString(), Name = "adsasdsa",
        //            Users = new List<User>
        //            {
        //                new User() { Nickname = "asdsa"}
        //            },
        //            Slides = new List<Slide>()
        //            {
        //                new Slide()
        //                {
        //                    Id = Guid.NewGuid().ToString(), Elements = new List<Element>()
        //                    {
        //                        new Text() {Content = "adasdsa", Position = new Position() {X = 5, Y = 10 } }
        //                    }
        //                }
        //            }
        //        },
        //    });
        //}
        public async Task JoinPresentation(string presentationId, string userName)
        {
            var findPres = _state.Presentations.First(x => x.Id == presentationId);
            if (findPres != null)
            {
                // Добавляем пользователя как "Viewer" если его еще нет
                if (!findPres.Users.Any(r => r.Nickname == userName))
                {
                    if (_state.AdminEnterAfterCreate[presentationId] == false)
                    {
                        findPres.Users.Add(new User
                        {
                            ConnectionId = Context.ConnectionId,
                            Nickname = userName,
                            Role = UserType.Owner,
                        });
                        _state.AdminEnterAfterCreate[presentationId] = true;
                    }
                    else
                    {
                        findPres.Users.Add(new User
                        {
                            ConnectionId = Context.ConnectionId,
                            Nickname = userName,
                            Role = UserType.Viewer,
                        });
                    }
                }
                else
                {
                    findPres.Users.Find(x => x.Nickname == userName)!.ConnectionId=Context.ConnectionId;
                }

                //_state.UserToPresentationMap[Context.ConnectionId] = presentationId;

                await _hubContext.Clients.All.SendAsync("ReceiveUpdate", JsonSerializer.Serialize(findPres));
                //string[] asdasdas = findPres.Users.Where(x => x==x/*.ConnectionId != Context.ConnectionId*/).Select((x, y) => x.ConnectionId).ToArray();
                //await _hubContext.Clients.Users(asdasdas).SendAsync("UserJoined", Context.ConnectionId, userName, "Viewer");
                //await _hubContext.Clients.All.SendAsync("UserJoined", Context.ConnectionId, userName, "Viewer");
                //await _hubContext.Clients.All.SendAsync("UserJoined", Context.ConnectionId, userName, "Viewer");
                //await _hubContext.Groups.AddToGroupAsync(Context.ConnectionId, presentationId);
                //await _hubContext.Clients.Group(presentationId).SendAsync("UserJoined", Context.ConnectionId, userName, "Viewer");
                //await _hubContext.Clients.Users(_state.UserToPresentationMap.Keys.Where(x => _state.UserToPresentationMap[x] == presentationId)).SendAsync("UserJoined", Context.ConnectionId, userName, "Viewer");
                //await _hubContext.Clients.Group(presentationId).SendAsync("TestGroup", "Da rabotay ti uzhe");
            }
        }

        public async Task<string?> CreatePresentation(string presentationName, string userName)
        {
            if (_state.Presentations.Any(p => p.Name == presentationName))
            {
                return null;
            }
            var presentationId = Guid.NewGuid().ToString();
            var presentation = new Presentation
            {
                Id = presentationId,
                Name = presentationName,
                Users = new List<User>
                {
                    new User
                    {
                        ConnectionId = Context.ConnectionId,
                        Nickname = userName,
                        Role = UserType.Owner,
                        
                    }
                }
            };
            _state.AdminEnterAfterCreate.Add(presentationId, false);
            _state.Presentations.Add(presentation);
            //_state.UserToPresentationMap[Context.ConnectionId] = presentationId;
            //await _hubContext.Groups.AddToGroupAsync(Context.ConnectionId, presentationId);
            // Уведомляем всех пользователей о новой презентации
            await _hubContext.Clients.AllExcept($"{Context.ConnectionId}").SendAsync("PresentationAdded", new { Id = presentationId, Name = presentationName });
            return presentationId;
        }
        public async Task AddSlide(string presentationId, string? position = null)
        {
            var presentation = _state.Presentations.FirstOrDefault(p => p.Id == presentationId);
            if (presentation != null)
            {
                // Создаем новый слайд с уникальным ID
                var newSlide = new Slide
                {
                    Id = Guid.NewGuid().ToString(),
                    Elements = new List<Element>()
                };

                // Определяем индекс для вставки
                if (position != null)
                {
                    presentation.Slides.Insert(presentation.Slides.FindIndex(x => x.Id == position), newSlide);
                }
                else
                {
                    // Если позиция не указана или некорректна, добавляем в конец
                    presentation.Slides.Add(newSlide);
                }

                // Уведомляем всех участников группы о добавлении слайда
                //await _hubContext.Clients.Group(presentationId).SendAsync("SlideAdded", newSlide, position);
                await _hubContext.Clients.All.SendAsync("SlideAdded", newSlide, position);
                await _hubContext.Clients.All.SendAsync("ReceiveUpdate", JsonSerializer.Serialize<Presentation>(presentation));
            }
        }

        public async Task DeleteSlide(string presentationId, string slideId)
        {
            var presentation = _state.Presentations.FirstOrDefault(p => p.Id == presentationId);
            if (presentation != null)
            {
                var slide = presentation.Slides.FirstOrDefault(s => s.Id == slideId);
                if (slide != null)
                {
                    presentation.Slides.Remove(slide);

                    // Уведомляем всех участников группы об удалении слайда
                    //await Clients.Group(presentationId).SendAsync("SlideDeleted", slideId);
                    //await Clients.All.SendAsync("SlideDeleted", slideId);
                    await _hubContext.Clients.All.SendAsync("ReceiveUpdate", JsonSerializer.Serialize<Presentation>(presentation));
                }
            }
        }

        public async Task ChangeRole(string presentationId, string targetUserName, UserType role)
        {
            var findPres = _state.Presentations.First(x => x.Id == presentationId);
            if (findPres != null)
            {
                var user = findPres.Users.FirstOrDefault(r => r.Nickname == targetUserName);
                if (user != null)
                {
                    if (user.Role != role)
                    {
                        user.Role = role;
                        //await Clients.Group(presentationId).SendAsync("RoleUpdated", targetUserName, role);
                        await _hubContext.Clients.All.SendAsync("ReceiveUpdate", JsonSerializer.Serialize<Presentation>(findPres));
                    }
                }
            }
        }
        public async Task UpdatePresentation(string data)
        {
            // Обновление данных презентации
            Presentation pres = JsonSerializer.Deserialize<Presentation>(data);
            var presToChange = _state.Presentations.First(x => x.Id == pres.Id);
            presToChange.Users = pres.Users;
            presToChange.Slides = pres.Slides;
            presToChange.Name = pres.Name;

            // Отправляем данные всем клиентам
            await _hubContext.Clients.All.SendAsync("ReceiveUpdate", data);
        }

        //public override async Task OnDisconnectedAsync(Exception exception)
        //{
        //    if (_state.UserToPresentationMap.TryGetValue(Context.ConnectionId, out var presentationId))
        //    {
        //        var findPres = _state.Presentations.FirstOrDefault(x => x.Id == presentationId);
        //        if (findPres != null)
        //        {
        //            var user = findPres.Users.FirstOrDefault(u => u.Nickname == Context.ConnectionId);
        //            if (user != null)
        //            {
        //                findPres.Users.Remove(user);
        //                await Clients.Group(presentationId).SendAsync("UserLeft", user.Nickname);
        //            }
        //        }

        //        _state.UserToPresentationMap.Remove(Context.ConnectionId);
        //        await Groups.RemoveFromGroupAsync(Context.ConnectionId, presentationId);
        //    }

        //    await base.OnDisconnectedAsync(exception);
        //}
        public async Task CheckGroupMembership(string groupId)
        {
            Console.WriteLine($"Broadcasting to group {groupId}");
            await Clients.Group(groupId).SendAsync("TestGroup", "Test message");
        }

        //public override async Task OnDisconnectedAsync(Exception? exception)
        //{
        //    var user = _state.Presentations.SelectMany(p => p.Users)
        //                              .FirstOrDefault(u => u.ConnectionId == Context.ConnectionId);

        //    if (user != null)
        //    {
        //        // Удаляем пользователя из презентации
        //        var presentation = _state.Presentations.First(p => p.Users.Contains(user));
        //        presentation.Users.Remove(user);

        //        // Оповещаем группу о выходе пользователя
        //        await Clients.Group(presentation.Id).SendAsync("UserLeft", user.Nickname);
        //    }

        //    await base.OnDisconnectedAsync(exception);
        //}
        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
            //Console.WriteLine($"Connected {Context.GetHttpContext()?.Request?.Query?.First(x => x.Key=="nickName").Value}" + Context.ConnectionId);
        }
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var id = Context.ConnectionId;
            var pres = _state.Presentations.First(x => x.Users.Any(y => y.ConnectionId == id));
            if (_state.AdminEnterAfterCreate.ContainsKey(pres.Id) && _state.AdminEnterAfterCreate[pres.Id] == false)
            {
                _state.AdminEnterAfterCreate[pres.Id] = true;
                return;
            }
            var user = pres.Users.First(x => x.ConnectionId == id);
            RemoveUserFromPresentation(pres.Id, user.Nickname);
            await base.OnDisconnectedAsync(exception);
        }
        public async void RemoveUserFromPresentation(string presentationId, string userNickName)
        {
            if (_state.Presentations.First(x => x.Id == presentationId).Users.Any(y => y.Nickname == userNickName))
            {
                var users = _state.Presentations.First(x => x.Id == presentationId).Users;
                var exactUser = users.Find(x => x.Nickname == userNickName);
                //if (exactUser.Role == UserType.Owner && _state.Presentations.First(x => x.Id == presentationId).Users.Count == 1)
                //{
                //    users.RemoveAll(x => x.Nickname == userNickName);
                //}
                //else if (exactUser.Role != UserType.Owner && _state.Presentations.First(x => x.Id == presentationId).Users.Count != 1)
                //{
                //    users.RemoveAll(x => x.Nickname == userNickName);
                //}
                users.RemoveAll(x => x.Nickname == userNickName);
                await _hubContext.Clients.All.SendAsync("ReceiveUpdate", JsonSerializer.Serialize<Presentation>(_state.Presentations.First(x => x.Id == presentationId)));
                // Обновляем список пользователей презентации, если он пустой, можно удалить презентацию
                if (users.Count == 0)
                {
                    _state.Presentations.RemoveAll(x => x.Id == presentationId);
                    await _hubContext.Clients.AllExcept($"{Context.ConnectionId}").SendAsync("PresentationDeleted", new { Id = presentationId });
                    return;
                }
            }
        }
    }
}
