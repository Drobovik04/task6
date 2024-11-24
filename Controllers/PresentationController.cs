using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Diagnostics;
using task6.Hub;
using task6.Models;

namespace task6.Controllers
{
    public class PresentationController : Controller
    {
        private PresentationHub _presentationHub;
        public PresentationController(PresentationHub presentation)
        {
            _presentationHub = presentation;
        }

        public IActionResult Index()
        {
            return View(_presentationHub._state.Presentations);
        }

        [HttpPost]
        public async Task<IActionResult> Join(string idPresentation, string nickName)
        {
            //await _presentationHub.JoinPresentation(idPresentation, nickName);
            return RedirectToAction("Presentation", new {idPresentation, isOwner = false, nickName});
        }

        [HttpPost]
        public async Task<IActionResult> Create(string conferenceName, string nickName)
        {
            string idPresentation = await _presentationHub.CreatePresentation(conferenceName, nickName);
            //return RedirectToAction("Index");
            return RedirectToAction("Presentation", new { idPresentation, isOwner = true, nickName});
        }

        public IActionResult Presentation(string idPresentation, bool isOwner, string nickName)
        {
            var pres = _presentationHub._state.Presentations.FirstOrDefault(x => x.Id == idPresentation);
            if (pres == null) return NotFound();
            ViewData["Owner"] = isOwner;
            ViewData["NickName"] = nickName;
            if (pres.Users.Find(x => x.Nickname == nickName) != null)
            {
                pres.Users = new List<User>();
            }
            return View(pres);
        }
        public IActionResult ChangeRole(string userId, string role, string idPresentation)
        {
            UserType newRole = UserType.Viewer;
            switch (role)
            {
                case "Editor": { newRole = UserType.Editor; break; }
                case "Viewer": { newRole = UserType.Viewer; break; }
            };
            _presentationHub._state.Presentations.Find(x => x.Id == idPresentation)!.Users.Find(x => x.ConnectionId == userId)!.Role = newRole;
            var pres = _presentationHub._state.Presentations.FirstOrDefault(x => x.Id == idPresentation);
            return View(pres);
        }

    }
}
